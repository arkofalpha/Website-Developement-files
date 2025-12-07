-- Seed Themes
INSERT INTO themes (id, name, description, order_index, weight) VALUES
(uuid_generate_v4(), 'Problem Identification and Market Need', 'Understanding market problems and customer needs', 1, 1.00),
(uuid_generate_v4(), 'Business Positioning and Target Market', 'Market positioning and target customer identification', 2, 1.00),
(uuid_generate_v4(), 'Product and Service Development', 'Product/service design and development processes', 3, 1.00),
(uuid_generate_v4(), 'Human Resource and Staffing', 'HR management and staffing strategies', 4, 1.00),
(uuid_generate_v4(), 'Marketing Channels and Customer Engagement', 'Marketing channels and customer interaction', 5, 1.00),
(uuid_generate_v4(), 'Marketing Strategy and Practice', 'Overall marketing strategy and implementation', 6, 1.00),
(uuid_generate_v4(), 'Business Systems', 'Operational systems and processes', 7, 1.00),
(uuid_generate_v4(), 'Record Keeping and Planning', 'Documentation and planning practices', 8, 1.00),
(uuid_generate_v4(), 'Assets and Equipment', 'Asset management and equipment utilization', 9, 1.00),
(uuid_generate_v4(), 'Financial Health and Performance', 'Financial management and performance tracking', 10, 1.00),
(uuid_generate_v4(), 'Business Sustainability and Continuity', 'Long-term sustainability and business continuity', 11, 1.00)
ON CONFLICT DO NOTHING;

-- Seed Sample Questions (2-3 per theme for MVP - full 98 questions would be added separately)
-- Theme 1: Problem Identification
INSERT INTO questions (theme_id, text, help_text, order_index, reverse_scored) 
SELECT id, 'My business has a clear problem it''s trying to solve.', 'Consider whether your business addresses a specific market need or problem', 1, false
FROM themes WHERE name = 'Problem Identification and Market Need';

INSERT INTO questions (theme_id, text, help_text, order_index, reverse_scored) 
SELECT id, 'The problem affects a large population.', 'Consider the size of your target market', 2, false
FROM themes WHERE name = 'Problem Identification and Market Need';

-- Theme 2: Business Positioning
INSERT INTO questions (theme_id, text, help_text, order_index, reverse_scored) 
SELECT id, 'My business targets end users directly (B2C).', 'Consider your primary customer type', 1, false
FROM themes WHERE name = 'Business Positioning and Target Market';

INSERT INTO questions (theme_id, text, help_text, order_index, reverse_scored) 
SELECT id, 'I have clearly defined my target market.', 'Consider how well you understand your ideal customers', 2, false
FROM themes WHERE name = 'Business Positioning and Target Market';

-- Add more questions as needed...

