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

    items.forEach((item: any) => {
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
        categories.forEach((cat: any) => {
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
      words.forEach((word: string) => {
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
    items.forEach((item: any) => {
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
    items.forEach((item: any) => {
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
      analysis.recommendations.push('✅ **Images available** - ' + imagePercentage + '% of articles have images, perfect for the dashboard');
      overallScore += 3;
    } else if (imagePercentage >= 50) {
      analysis.recommendations.push('⚠️ **Few images** - Only ' + imagePercentage + '% of articles have images, dashboard will be partially empty');
      overallScore += 2;
    } else if (imagePercentage >= 20) {
      analysis.recommendations.push('⚠️ **Very few images** - Only ' + imagePercentage + '% of articles have images, many articles will not be displayed');
      overallScore += 1;
    } else {
      analysis.recommendations.push('❌ **No images** - Only ' + imagePercentage + '% of articles have images. Articles will not be displayed in the dashboard!');
    }
    maxScore += 3;
    
    // Check article count
    if (analysis.feedInfo.itemCount >= 20) {
      analysis.recommendations.push('✅ **Many articles** - Feed has ' + analysis.feedInfo.itemCount + ' articles, sufficient for regular updates');
      overallScore += 2;
    } else if (analysis.feedInfo.itemCount >= 10) {
      analysis.recommendations.push('⚠️ **Few articles** - Feed has only ' + analysis.feedInfo.itemCount + ' articles, updates might be irregular');
      overallScore += 1;
    } else {
      analysis.recommendations.push('❌ **Very few articles** - Feed has only ' + analysis.feedInfo.itemCount + ' articles, not recommended');
    }
    maxScore += 2;
    
    // Check language
    const language = analysis.tagAnalysis.languageAnalysis.primaryLanguage.toLowerCase();
    if (language === 'de' || language === 'de-de' || language === 'deutsch') {
      analysis.recommendations.push('✅ **German language** - Feed is in German, perfect for the dashboard');
      overallScore += 2;
    } else if (language === 'en' || language === 'en-us' || language === 'en-gb' || language === 'english') {
      analysis.recommendations.push('⚠️ **English language** - Feed is in English, articles will not be translated');
      overallScore += 1;
    } else {
      analysis.recommendations.push('❌ **Foreign language** - Feed is in ' + analysis.tagAnalysis.languageAnalysis.primaryLanguage + ', not suitable for German dashboard');
    }
    maxScore += 2;
    
    // Check categories
    if (analysis.tagAnalysis.contentStructure.hasCategories) {
      analysis.recommendations.push('✅ **Categories available** - Feed has categories, good for future filtering');
      overallScore += 1;
    } else {
      analysis.recommendations.push('ℹ️ **No categories** - Feed has no categories, but this is not critical');
    }
    maxScore += 1;
    
    // Check content quality
    if (analysis.tagAnalysis.contentStructure.averageTitleLength >= 30) {
      analysis.recommendations.push('✅ **Good titles** - Articles have meaningful titles (Ø ' + analysis.tagAnalysis.contentStructure.averageTitleLength + ' characters)');
      overallScore += 1;
    } else {
      analysis.recommendations.push('⚠️ **Short titles** - Articles have very short titles (Ø ' + analysis.tagAnalysis.contentStructure.averageTitleLength + ' characters)');
    }
    maxScore += 1;
    
    // Overall recommendation
    const scorePercentage = Math.round((overallScore / maxScore) * 100);
    let recommendation = '';
    
    if (scorePercentage >= 80) {
      recommendation = '🟢 **HIGHLY RECOMMENDED** - This RSS feed is perfect for the dashboard!';
    } else if (scorePercentage >= 60) {
      recommendation = '🟡 **RECOMMENDED** - This RSS feed is well suited, with minor limitations.';
    } else if (scorePercentage >= 40) {
      recommendation = '🟠 **CONDITIONALLY RECOMMENDED** - This RSS feed is only conditionally suitable.';
    } else {
      recommendation = '🔴 **NOT RECOMMENDED** - This RSS feed is not suitable for the dashboard.';
    }
    
    // Add summary at the end
    let summary = '';
    if (scorePercentage >= 80) {
      summary = '💡 **Summary:** This RSS feed can be added to the dashboard immediately!';
    } else if (scorePercentage >= 60) {
      summary = '💡 **Summary:** This RSS feed is well suited, but please note the comments above.';
    } else if (scorePercentage >= 40) {
      summary = '💡 **Summary:** This RSS feed is only conditionally recommended. Consider whether it is really needed.';
    } else {
      summary = '💡 **Summary:** This RSS feed is not suitable for the dashboard. Look for a better feed.';
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
