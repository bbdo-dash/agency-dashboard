import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

interface RSSAnalysisResult {
  feedInfo: {
    title: string;
    description: string;
    link: string;
    language: string;
    lastBuildDate: string;
    itemCount: number;
  };
  tagAnalysis: {
    commonTags: Array<{ tag: string; count: number; examples: string[] }>;
    categoryMapping: Array<{ category: string; frequency: number; examples: string[] }>;
    languageAnalysis: {
      detectedLanguages: string[];
      primaryLanguage: string;
    };
    contentStructure: {
      hasImages: boolean;
      hasEnclosures: boolean;
      hasCategories: boolean;
      averageTitleLength: number;
      averageDescriptionLength: number;
    };
  };
  translationSuggestions: Array<{
    originalTag: string;
    suggestedTranslation: string;
    confidence: number;
    context: string;
  }>;
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch RSS feed
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS-Analyzer/1.0)',
      },
      next: { revalidate: 0 } // Don't cache during analysis
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch RSS feed: ${response.status}` 
      }, { status: 400 });
    }

    const xmlContent = await response.text();

    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
          isArray: (name) => name === 'item' || name === 'category'
    });

    const parsed = parser.parse(xmlContent);
    const channel = parsed?.rss?.channel;
    const items = channel?.item || [];

    if (!channel || !Array.isArray(items)) {
      return NextResponse.json({ 
        error: 'Invalid RSS feed format' 
      }, { status: 400 });
    }

    // Analyze feed structure
    const analysis: RSSAnalysisResult = {
      feedInfo: {
        title: channel.title || 'Unknown',
        description: channel.description || '',
        link: channel.link || '',
        language: channel.language || 'unknown',
        lastBuildDate: channel.lastBuildDate || '',
        itemCount: items.length
      },
      tagAnalysis: {
        commonTags: [],
        categoryMapping: [],
        languageAnalysis: {
          detectedLanguages: [],
          primaryLanguage: 'unknown'
        },
        contentStructure: {
          hasImages: false,
          hasEnclosures: false,
          hasCategories: false,
          averageTitleLength: 0,
          averageDescriptionLength: 0
        }
      },
      translationSuggestions: [],
      recommendations: []
    };

    // Analyze items
    const tagCounts: { [key: string]: number } = {};
    const categoryCounts: { [key: string]: { count: number; examples: string[] } } = {};
    const titles: string[] = [];
    const descriptions: string[] = [];
    let hasImages = false;
    let hasEnclosures = false;
    let hasCategories = false;

    items.forEach((item: unknown) => {
      // Analyze titles and descriptions
      if (item.title) {
        titles.push(item.title);
        analysis.tagAnalysis.contentStructure.averageTitleLength += item.title.length;
      }
      
      if (item.description) {
        descriptions.push(item.description);
        analysis.tagAnalysis.contentStructure.averageDescriptionLength += item.description.length;
      }

      // Check for images
      if (item['media:content'] || item.enclosure) {
        hasImages = true;
      }
      if (item.enclosure) {
        hasEnclosures = true;
      }

      // Analyze categories
      if (item.category) {
        hasCategories = true;
        const categories = Array.isArray(item.category) ? item.category : [item.category];
        categories.forEach((cat: unknown) => {
          const categoryName = typeof cat === 'string' ? cat : (cat['#text'] || cat.toString());
          if (!categoryCounts[categoryName]) {
            categoryCounts[categoryName] = { count: 0, examples: [] };
          }
          categoryCounts[categoryName].count++;
          if (categoryCounts[categoryName].examples.length < 3 && item.title) {
            categoryCounts[categoryName].examples.push(item.title);
          }
        });
      }

      // Extract and count common tags from content
      const content = (item.description || item.title || '').toLowerCase();
      const words = content.match(/\b\w{3,}\b/g) || [];
      words.forEach(word => {
        tagCounts[word] = (tagCounts[word] || 0) + 1;
      });
    });

    // Calculate averages
    if (titles.length > 0) {
      analysis.tagAnalysis.contentStructure.averageTitleLength = 
        Math.round(analysis.tagAnalysis.contentStructure.averageTitleLength / titles.length);
    }
    if (descriptions.length > 0) {
      analysis.tagAnalysis.contentStructure.averageDescriptionLength = 
        Math.round(analysis.tagAnalysis.contentStructure.averageDescriptionLength / descriptions.length);
    }

    analysis.tagAnalysis.contentStructure.hasImages = hasImages;
    analysis.tagAnalysis.contentStructure.hasEnclosures = hasEnclosures;
    analysis.tagAnalysis.contentStructure.hasCategories = hasCategories;

    // Get top tags
    analysis.tagAnalysis.commonTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({
        tag,
        count,
        examples: titles.filter(title => 
          title.toLowerCase().includes(tag)
        ).slice(0, 3)
      }));

    // Get category mapping
    analysis.tagAnalysis.categoryMapping = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b.count - a.count)
      .map(([category, data]) => ({
        category,
        frequency: data.count,
        examples: data.examples
      }));

    // Language analysis
    const languages = new Set<string>();
    items.forEach((item: unknown) => {
      if (item.language) {
        languages.add(item.language);
      }
    });
    analysis.tagAnalysis.languageAnalysis.detectedLanguages = Array.from(languages);
    analysis.tagAnalysis.languageAnalysis.primaryLanguage = 
      channel.language || analysis.tagAnalysis.languageAnalysis.detectedLanguages[0] || 'unknown';

    // Generate translation suggestions for German market
    const germanTranslations: { [key: string]: string } = {
      'marketing': 'Marketing',
      'advertising': 'Werbung',
      'brand': 'Marke',
      'campaign': 'Kampagne',
      'digital': 'Digital',
      'social': 'Social Media',
      'content': 'Content',
      'strategy': 'Strategie',
      'creative': 'Kreativ',
      'media': 'Medien',
      'agency': 'Agentur',
      'client': 'Kunde',
      'business': 'Business',
      'innovation': 'Innovation',
      'technology': 'Technologie',
      'design': 'Design',
      'communication': 'Kommunikation',
      'public': 'Öffentlich',
      'relations': 'Beziehungen',
      'pr': 'PR',
      'event': 'Event',
      'conference': 'Konferenz',
      'award': 'Auszeichnung',
      'festival': 'Festival',
      'exhibition': 'Ausstellung'
    };

    analysis.translationSuggestions = analysis.tagAnalysis.commonTags
      .filter(({ tag }) => germanTranslations[tag.toLowerCase()])
      .map(({ tag, count }) => ({
        originalTag: tag,
        suggestedTranslation: germanTranslations[tag.toLowerCase()],
        confidence: Math.min(95, 60 + (count / items.length) * 35),
        context: `Used in ${count} out of ${items.length} items`
      }));

    // Generate comprehensive recommendations
    analysis.recommendations = [];
    
    // Overall assessment
    let overallScore = 0;
    let maxScore = 0;
    
    // Check images (most important for dashboard)
    // Count actual articles with images
    let articlesWithImages = 0;
    items.forEach((item: unknown) => {
      // Check for images in various formats
      const hasMediaContent = item?.['media:content'] || item?.media?.content;
      const hasEnclosure = item?.enclosure;
      const hasImageInContent = item?.['content:encoded']?.includes('<img') || item?.description?.includes('<img');
      
      if (hasMediaContent || hasEnclosure || hasImageInContent) {
        articlesWithImages++;
      }
    });
    
    const imagePercentage = Math.round((articlesWithImages / items.length) * 100);
    
    if (imagePercentage >= 80) {
      analysis.recommendations.push('✅ **Bilder vorhanden** - ' + imagePercentage + '% der Artikel haben Bilder, perfekt für das Dashboard');
      overallScore += 3;
    } else if (imagePercentage >= 50) {
      analysis.recommendations.push('⚠️ **Wenige Bilder** - Nur ' + imagePercentage + '% der Artikel haben Bilder, Dashboard wird teilweise leer sein');
      overallScore += 2;
    } else if (imagePercentage >= 20) {
      analysis.recommendations.push('⚠️ **Sehr wenige Bilder** - Nur ' + imagePercentage + '% der Artikel haben Bilder, viele Artikel werden nicht angezeigt');
      overallScore += 1;
    } else {
      analysis.recommendations.push('❌ **Keine Bilder** - Nur ' + imagePercentage + '% der Artikel haben Bilder. Artikel werden nicht im Dashboard angezeigt!');
    }
    maxScore += 3;
    
    // Check article count
    if (analysis.feedInfo.itemCount >= 20) {
      analysis.recommendations.push('✅ **Viele Artikel** - Feed hat ' + analysis.feedInfo.itemCount + ' Artikel, ausreichend für regelmäßige Updates');
      overallScore += 2;
    } else if (analysis.feedInfo.itemCount >= 10) {
      analysis.recommendations.push('⚠️ **Wenige Artikel** - Feed hat nur ' + analysis.feedInfo.itemCount + ' Artikel, Updates könnten unregelmäßig sein');
      overallScore += 1;
    } else {
      analysis.recommendations.push('❌ **Sehr wenige Artikel** - Feed hat nur ' + analysis.feedInfo.itemCount + ' Artikel, nicht empfehlenswert');
    }
    maxScore += 2;
    
    // Check language
    const language = analysis.tagAnalysis.languageAnalysis.primaryLanguage.toLowerCase();
    if (language === 'de' || language === 'de-de' || language === 'deutsch') {
      analysis.recommendations.push('✅ **Deutsche Sprache** - Feed ist auf Deutsch, perfekt für das Dashboard');
      overallScore += 2;
    } else if (language === 'en' || language === 'en-us' || language === 'en-gb' || language === 'english') {
      analysis.recommendations.push('⚠️ **Englische Sprache** - Feed ist auf Englisch, Artikel werden nicht übersetzt');
      overallScore += 1;
    } else {
      analysis.recommendations.push('❌ **Fremdsprache** - Feed ist auf ' + analysis.tagAnalysis.languageAnalysis.primaryLanguage + ', nicht für deutsches Dashboard geeignet');
    }
    maxScore += 2;
    
    // Check categories
    if (analysis.tagAnalysis.contentStructure.hasCategories) {
      analysis.recommendations.push('✅ **Kategorien vorhanden** - Feed hat Kategorien, gut für zukünftige Filterung');
      overallScore += 1;
    } else {
      analysis.recommendations.push('ℹ️ **Keine Kategorien** - Feed hat keine Kategorien, aber das ist nicht kritisch');
    }
    maxScore += 1;
    
    // Check content quality
    if (analysis.tagAnalysis.contentStructure.averageTitleLength >= 30) {
      analysis.recommendations.push('✅ **Gute Titel** - Artikel haben aussagekräftige Titel (Ø ' + analysis.tagAnalysis.contentStructure.averageTitleLength + ' Zeichen)');
      overallScore += 1;
    } else {
      analysis.recommendations.push('⚠️ **Kurze Titel** - Artikel haben sehr kurze Titel (Ø ' + analysis.tagAnalysis.contentStructure.averageTitleLength + ' Zeichen)');
    }
    maxScore += 1;
    
    // Overall recommendation
    const scorePercentage = Math.round((overallScore / maxScore) * 100);
    let recommendation = '';
    
    if (scorePercentage >= 80) {
      recommendation = '🟢 **SEHR EMPFEHLENSWERT** - Dieser RSS-Feed ist perfekt für das Dashboard geeignet!';
    } else if (scorePercentage >= 60) {
      recommendation = '🟡 **EMPFOHLEN** - Dieser RSS-Feed ist gut geeignet, mit kleinen Einschränkungen.';
    } else if (scorePercentage >= 40) {
      recommendation = '🟠 **BEDINGT EMPFEHLENSWERT** - Dieser RSS-Feed ist nur bedingt geeignet.';
    } else {
      recommendation = '🔴 **NICHT EMPFEHLENSWERT** - Dieser RSS-Feed ist nicht für das Dashboard geeignet.';
    }
    
    // Add summary at the end
    let summary = '';
    if (scorePercentage >= 80) {
      summary = '💡 **Zusammenfassung:** Dieser RSS-Feed kann sofort zum Dashboard hinzugefügt werden!';
    } else if (scorePercentage >= 60) {
      summary = '💡 **Zusammenfassung:** Dieser RSS-Feed ist gut geeignet, aber beachten Sie die Hinweise oben.';
    } else if (scorePercentage >= 40) {
      summary = '💡 **Zusammenfassung:** Dieser RSS-Feed ist nur bedingt empfehlenswert. Überlegen Sie, ob er wirklich benötigt wird.';
    } else {
      summary = '💡 **Zusammenfassung:** Dieser RSS-Feed ist nicht für das Dashboard geeignet. Suchen Sie nach einem besseren Feed.';
    }
    
    analysis.recommendations.push('---');
    analysis.recommendations.push(summary);
    
    analysis.recommendations.unshift('---');
    analysis.recommendations.unshift('**BEWERTUNG: ' + scorePercentage + '% (' + overallScore + '/' + maxScore + ')**');
    analysis.recommendations.unshift(recommendation);
    analysis.recommendations.unshift('---');

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Error analyzing RSS feed:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze RSS feed' 
    }, { status: 500 });
  }
}
