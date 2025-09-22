'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface BackgroundAnimationProps {
  className?: string;
}

const BackgroundAnimation: React.FC<BackgroundAnimationProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Create gradient colors based on theme
  const getLightModeColors = () => [
    'rgba(182, 221, 246, 0.3)', // Light blue (matches calendar bg)
    'rgba(255, 200, 170, 0.2)', // Light orange (matches instagram bg)
    'rgba(233, 136, 136, 0.2)', // Light red (matches news bg)
    'rgba(154, 178, 214, 0.2)', // Additional blue shade
  ];
  
  const getDarkModeColors = () => [
    'rgba(45, 85, 145, 0.25)', // Darker blue for dark mode
    'rgba(120, 65, 40, 0.2)', // Darker brown/orange for dark mode
    'rgba(100, 50, 60, 0.2)', // Darker red for dark mode
    'rgba(55, 65, 120, 0.2)', // Darker indigo shade for dark mode
  ];

  // Check for dark mode (only class-based, no system preference)
  useEffect(() => {
    const htmlEl = document.documentElement;
    
    // Check only for class-based theme
    function checkDarkMode() {
      const hasDarkClass = htmlEl.classList.contains('dark');
      setIsDarkMode(hasDarkClass);
    }
    
    const handleClassChange = () => {
      const hasDarkClass = htmlEl.classList.contains('dark');
      setIsDarkMode(hasDarkClass);
    };
    
    // Initial check
    checkDarkMode();
    
    // Set up mutation observer to detect class changes on html element
    const observer = new MutationObserver(handleClassChange);
    observer.observe(htmlEl, { attributes: true, attributeFilter: ['class'] });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    
    // Get theme-appropriate colors
    const gradientColors = isDarkMode ? getDarkModeColors() : getLightModeColors();

    // Initialize the canvas size and points
    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      // Define the central content area to avoid
      const contentMarginX = width * 0.12; // 12% margin from edges
      const contentMarginY = height * 0.08; // 8% margin from edges
      
      // Calculate base radius sizing based on theme
      const baseRadiusMin = isDarkMode ? 220 : 180;
      const baseRadiusMax = isDarkMode ? 180 : 150;
      
      // Calculate edge zones
      const topZone = { x: [0, width], y: [0, contentMarginY] };
      const bottomZone = { x: [0, width], y: [height - contentMarginY, height] };
      const leftZone = { x: [0, contentMarginX], y: [contentMarginY, height - contentMarginY] };
      const rightZone = { x: [width - contentMarginX, width], y: [contentMarginY, height - contentMarginY] };
      
      // Create points in the edge zones
      const numPoints = 12; // More points for better edge coverage
      pointsRef.current = Array.from({ length: numPoints }, (_, i) => {
        let x = 0;
        let y = 0;
        
        // Prefer corners and edges for more interesting flows
        const zone = i % 5;
        switch(zone) {
          case 0: // Top left corner
            x = Math.random() * contentMarginX * 1.5;
            y = Math.random() * contentMarginY * 1.5;
            break;
          case 1: // Top right corner
            x = width - (Math.random() * contentMarginX * 1.5);
            y = Math.random() * contentMarginY * 1.5;
            break;
          case 2: // Bottom right corner
            x = width - (Math.random() * contentMarginX * 1.5);
            y = height - (Math.random() * contentMarginY * 1.5);
            break;
          case 3: // Bottom left corner
            x = Math.random() * contentMarginX * 1.5;
            y = height - (Math.random() * contentMarginY * 1.5);
            break;
          case 4: // Random edge
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { // Top
              x = Math.random() * width;
              y = Math.random() * contentMarginY;
            } else if (edge === 1) { // Right
              x = width - (Math.random() * contentMarginX);
              y = contentMarginY + Math.random() * (height - 2 * contentMarginY);
            } else if (edge === 2) { // Bottom
              x = Math.random() * width;
              y = height - (Math.random() * contentMarginY);
            } else { // Left
              x = Math.random() * contentMarginX;
              y = contentMarginY + Math.random() * (height - 2 * contentMarginY);
            }
            break;
        }
        
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.25, // Slower movement
          vy: (Math.random() - 0.5) * 0.25, // Slower movement
          radius: baseRadiusMin + Math.random() * baseRadiusMax, // Theme-appropriate radius
          color: gradientColors[i % gradientColors.length]
        };
      });
    };

    // Handle window resize
    const handleResize = () => {
      init();
    };

    // Animation function
    const animate = () => {
      // Clear with theme-appropriate background
      ctx.fillStyle = isDarkMode ? 'rgba(17, 24, 39, 0.05)' : 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(0, 0, width, height);
      
      // Define the central content area to avoid
      const contentX = width * 0.25; // Start at 25% from left
      const contentWidth = width * 0.5; // 50% of screen width
      const contentY = height * 0.15; // Start at 15% from top
      const contentHeight = height * 0.7; // 70% of screen height
      
      // Update and draw each point
      pointsRef.current.forEach((point) => {
        // Move point
        point.x += point.vx;
        point.y += point.vy;

        // Avoid central content area by redirecting points
        const inContentX = point.x > contentX && point.x < contentX + contentWidth;
        const inContentY = point.y > contentY && point.y < contentY + contentHeight;
        
        if (inContentX && inContentY) {
          // If point entered the content area, adjust direction to move it away
          // Determine closest edge and push toward it
          const distToLeft = point.x - contentX;
          const distToRight = contentX + contentWidth - point.x;
          const distToTop = point.y - contentY;
          const distToBottom = contentY + contentHeight - point.y;
          
          // Find the closest edge
          const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
          
          // Apply a gentle force toward that edge
          if (minDist === distToLeft) {
            point.vx = -Math.abs(point.vx) - 0.05;
          } else if (minDist === distToRight) {
            point.vx = Math.abs(point.vx) + 0.05;
          } else if (minDist === distToTop) {
            point.vy = -Math.abs(point.vy) - 0.05;
          } else if (minDist === distToBottom) {
            point.vy = Math.abs(point.vy) + 0.05;
          }
        }

        // Bounce off edges of the screen
        if (point.x < 0 || point.x > width) point.vx *= -1;
        if (point.y < 0 || point.y > height) point.vy *= -1;

        // Draw gradient circle
        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, point.radius
        );
        gradient.addColorStop(0, point.color);
        gradient.addColorStop(0.7, isDarkMode ? 'rgba(10, 10, 20, 0.05)' : 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, isDarkMode ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connect points with bezier curves only if they're not both in the content area
      ctx.lineWidth = isDarkMode ? 1.5 : 2;
      
      for (let i = 0; i < pointsRef.current.length - 1; i++) {
        const pointA = pointsRef.current[i];
        
        for (let j = i + 1; j < pointsRef.current.length; j++) {
          const pointB = pointsRef.current[j];
          
          // Skip connections that cross through the center content area
          const pointAInContent = 
            pointA.x > contentX && 
            pointA.x < contentX + contentWidth && 
            pointA.y > contentY && 
            pointA.y < contentY + contentHeight;
            
          const pointBInContent = 
            pointB.x > contentX && 
            pointB.x < contentX + contentWidth && 
            pointB.y > contentY && 
            pointB.y < contentY + contentHeight;
          
          // Only draw connection if at least one point is outside content area
          // and they're close enough to each other
          const distance = Math.sqrt(
            Math.pow(pointB.x - pointA.x, 2) + 
            Math.pow(pointB.y - pointA.y, 2)
          );
          
          if (distance < 450 && !(pointAInContent && pointBInContent)) {
            // Create more natural curve control points
            const midX = (pointA.x + pointB.x) / 2;
            const midY = (pointA.y + pointB.y) / 2;
            
            // Add some randomization to control points for more organic curves
            const cpX1 = midX + Math.sin(Date.now() * 0.001 + i) * 50;
            const cpY1 = midY + Math.cos(Date.now() * 0.001 + j) * 50;
            
            // Draw bezier curve
            const gradient = ctx.createLinearGradient(
              pointA.x, pointA.y, pointB.x, pointB.y
            );
            gradient.addColorStop(0, pointA.color);
            gradient.addColorStop(1, pointB.color);
            
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.moveTo(pointA.x, pointA.y);
            ctx.quadraticCurveTo(cpX1, cpY1, pointB.x, pointB.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize and start animation
    init();
    animate();
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDarkMode]); // Re-run effect when dark mode changes

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full pointer-events-none -z-10 ${
        isDarkMode ? 'opacity-60 bg-gray-900' : 'opacity-70 bg-white'
      } transition-colors duration-300 ease-in-out ${className}`}
    />
  );
};

export default BackgroundAnimation; 