/*
  # Create blog posts table

  1. New Tables
    - `blog_posts`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `excerpt` (text, required)
      - `content` (text, required)
      - `published_at` (timestamp with time zone)
      - `author` (text, required)
      - `image` (text, URL for cover image)
      - `slug` (text, unique, for SEO-friendly URLs)
      - `status` (text, default 'published')
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `blog_posts` table
    - Add policy for public read access to published posts
    - Add policy for authenticated users to manage posts (if needed)

  3. Indexes
    - Index on published_at for sorting
    - Index on slug for lookups
    - Index on status for filtering
*/

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  published_at timestamptz DEFAULT now(),
  author text NOT NULL DEFAULT 'Viduto Team',
  image text,
  slug text UNIQUE,
  status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read published blog posts"
  ON blog_posts
  FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Authenticated users can manage blog posts"
  ON blog_posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial blog posts data
INSERT INTO blog_posts (title, excerpt, content, published_at, author, image, slug) VALUES
(
  'Getting Started with AI Video Creation',
  'Learn how to create professional videos using AI technology in just a few minutes.',
  '# Getting Started with AI Video Creation

AI video creation is revolutionizing how we produce content. With Viduto, you can transform simple text descriptions and images into professional-quality videos in minutes.

## What Makes AI Video Creation Special?

Traditional video production requires expensive equipment, technical expertise, and hours of editing. AI video creation changes this by:

- **Speed**: Generate videos in minutes, not hours
- **Accessibility**: No technical skills required
- **Cost-effective**: Fraction of traditional production costs
- **Consistency**: Maintain brand standards across all content

## Getting Started

1. **Upload an Image**: Start with a product photo or any image
2. **Describe Your Vision**: Tell our AI what kind of video you want
3. **Let AI Work**: Our system generates your video automatically
4. **Download and Share**: Get your professional video ready to use

## Best Practices

- Use high-quality images for best results
- Be specific in your descriptions
- Consider your target audience
- Test different styles and approaches

Start creating amazing videos today with Viduto!',
  '2024-01-15T10:00:00Z',
  'Viduto Team',
  'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
  'getting-started-ai-video-creation'
),
(
  'Best Practices for Video Marketing',
  'Discover the key strategies for creating engaging video content that converts.',
  '# Best Practices for Video Marketing

Video marketing has become essential for businesses looking to engage their audience and drive conversions. Here are the key strategies that work.

## Understanding Your Audience

Before creating any video content, you need to understand:

- **Demographics**: Age, location, interests
- **Pain Points**: What problems do they face?
- **Preferences**: What type of content do they consume?
- **Platforms**: Where do they spend their time?

## Content Strategy

### 1. Hook Viewers Early
You have 3-5 seconds to capture attention. Start with:
- Compelling visuals
- Intriguing questions
- Bold statements
- Preview of value

### 2. Tell a Story
Great marketing videos tell stories that:
- Connect emotionally
- Show transformation
- Demonstrate value
- Include clear calls-to-action

### 3. Optimize for Platforms
Different platforms require different approaches:
- **Instagram**: Square format, captions
- **TikTok**: Vertical, trending sounds
- **YouTube**: Longer form, SEO optimization
- **LinkedIn**: Professional tone, industry insights

## Measuring Success

Track these key metrics:
- **View Rate**: How many people watch
- **Engagement**: Likes, comments, shares
- **Click-through Rate**: Actions taken
- **Conversion Rate**: Actual results

## Tools and Technology

Modern AI tools like Viduto make it easier than ever to create professional video content at scale. Focus on:
- Consistent branding
- Quality over quantity
- Regular posting schedule
- Community engagement

Start implementing these strategies today and watch your video marketing results improve!',
  '2024-01-10T14:30:00Z',
  'Marketing Team',
  'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800',
  'best-practices-video-marketing'
),
(
  'The Future of Content Creation',
  'Explore how AI is changing the landscape of digital content creation.',
  '# The Future of Content Creation

Artificial intelligence is transforming content creation in ways we never imagined. From automated video generation to personalized content at scale, the future is here.

## The AI Revolution

We''re witnessing a fundamental shift in how content is created:

### Traditional Content Creation
- Time-intensive processes
- High skill barriers
- Expensive production costs
- Limited scalability

### AI-Powered Creation
- Instant generation
- Accessible to everyone
- Cost-effective solutions
- Unlimited scalability

## Key Trends Shaping the Future

### 1. Personalization at Scale
AI enables creators to:
- Generate personalized content for different audiences
- Adapt messaging for various platforms
- Create multiple variations quickly
- Test and optimize automatically

### 2. Democratization of Creation
AI tools are making professional-quality content creation accessible to:
- Small businesses
- Individual creators
- Non-technical users
- Global audiences

### 3. Real-time Adaptation
Future AI systems will:
- Adjust content based on performance
- Respond to trending topics instantly
- Optimize for engagement automatically
- Learn from audience feedback

## Challenges and Opportunities

### Challenges
- Maintaining authenticity
- Ensuring quality control
- Managing ethical considerations
- Balancing automation with human creativity

### Opportunities
- Faster time-to-market
- Lower production costs
- Greater creative experimentation
- Enhanced audience engagement

## What This Means for Creators

The future belongs to creators who:
- Embrace AI as a creative partner
- Focus on strategy and storytelling
- Maintain their unique voice
- Continuously adapt and learn

## Getting Ready for Tomorrow

To prepare for the future of content creation:

1. **Experiment with AI tools** like Viduto
2. **Focus on your unique perspective**
3. **Learn to prompt and guide AI effectively**
4. **Stay updated with emerging technologies**
5. **Build authentic connections with your audience**

The future of content creation is bright, and AI is making it more accessible than ever. Start exploring these tools today and be part of the revolution!',
  '2024-01-05T09:15:00Z',
  'Tech Team',
  'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
  'future-of-content-creation'
);