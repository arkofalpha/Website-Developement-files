import pool from '../config/database.js';

/**
 * Seed all 98 questions across 11 themes
 * This is a template - you'll need to add the actual question text
 */
async function seedQuestions() {
  try {
    // Get themes
    const themesResult = await pool.query('SELECT id, name FROM themes ORDER BY order_index');
    const themes = themesResult.rows;

    // Question data structure: [themeName, questions[]]
    const questionsData = [
      ['Problem Identification and Market Need', [
        'My business has a clear problem it\'s trying to solve.',
        'The problem affects a large population.',
        'I have validated the problem with potential customers.',
        'The problem is urgent and requires immediate attention.',
        'My solution addresses the root cause of the problem.',
        'I understand the problem better than my competitors.',
        'The problem is likely to persist or grow over time.',
      ]],
      ['Business Positioning and Target Market', [
        'My business targets end users directly (B2C).',
        'I have clearly defined my target market.',
        'I understand my customers\' needs and preferences.',
        'My target market is large enough to sustain growth.',
        'I have identified my ideal customer profile.',
        'My positioning is clear and differentiated.',
        'I regularly gather feedback from my target market.',
      ]],
      // Add more themes and questions as needed
      // This is a template - complete with all 98 questions
    ];

    let questionOrder = 1;

    for (const [themeName, questions] of questionsData) {
      const theme = themes.find(t => t.name === themeName);
      if (!theme) {
        console.log(`Theme not found: ${themeName}`);
        continue;
      }

      for (const questionText of questions) {
        await pool.query(
          `INSERT INTO questions (theme_id, text, order_index, is_active)
           VALUES ($1, $2, $3, true)
           ON CONFLICT DO NOTHING`,
          [theme.id, questionText, questionOrder++]
        );
      }
    }

    console.log('Questions seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }
}

seedQuestions();

