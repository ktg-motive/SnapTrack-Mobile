import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../styles/theme';

interface MarkdownRendererProps {
  content: string;
}

interface ParsedElement {
  type: 'heading' | 'paragraph' | 'listItem' | 'code' | 'bold' | 'text';
  content: string;
  level?: number;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const parseMarkdown = (markdown: string): ParsedElement[] => {
    const lines = markdown.split('\n');
    const elements: ParsedElement[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;

      // Headings (# ## ###)
      if (trimmedLine.startsWith('#')) {
        const level = (trimmedLine.match(/^#+/) || [''])[0].length;
        const content = trimmedLine.replace(/^#+\s*/, '');
        elements.push({ type: 'heading', content, level });
      }
      // List items (- or *)
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        const content = trimmedLine.replace(/^[-*]\s*/, '');
        elements.push({ type: 'listItem', content });
      }
      // Code blocks (```)
      else if (trimmedLine.startsWith('```')) {
        // Skip code block markers for now
        continue;
      }
      // Regular paragraphs
      else {
        elements.push({ type: 'paragraph', content: trimmedLine });
      }
    }

    return elements;
  };

  const renderInlineFormatting = (text: string) => {
    // Handle **bold** text
    const parts = text.split(/(\*\*.*?\*\*)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <Text key={index} style={styles.bold}>
            {boldText}
          </Text>
        );
      }
      return part;
    });
  };

  const renderElement = (element: ParsedElement, index: number) => {
    switch (element.type) {
      case 'heading':
        const headingStyle = element.level === 1 ? styles.h1 : 
                           element.level === 2 ? styles.h2 : 
                           styles.h3;
        return (
          <Text key={index} style={headingStyle}>
            {renderInlineFormatting(element.content)}
          </Text>
        );
      
      case 'listItem':
        return (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              {renderInlineFormatting(element.content)}
            </Text>
          </View>
        );
      
      case 'paragraph':
        return (
          <Text key={index} style={styles.paragraph}>
            {renderInlineFormatting(element.content)}
          </Text>
        );
      
      default:
        return null;
    }
  };

  const elements = parseMarkdown(content);

  return (
    <View style={styles.container}>
      {elements.map(renderElement)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  h1: {
    ...typography.title1,
    color: colors.textPrimary,
    marginBottom: 16,
    marginTop: 20,
  },
  h2: {
    ...typography.title2,
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 16,
  },
  h3: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  paragraph: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 16,
  },
  bullet: {
    ...typography.body,
    color: colors.primary,
    marginRight: 8,
    fontWeight: 'bold',
  },
  listText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});