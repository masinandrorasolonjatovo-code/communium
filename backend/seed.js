const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  try {
    await client.connect();

    // Insert test users
    const users = [
      { username: 'vip_user', email: 'vip@example.com', role: 'VIP' },
      { username: 'regular_user', email: 'regular@example.com', role: 'Regular' },
      { username: 'youth_user', email: 'youth@example.com', role: 'Youth' },
    ];

    for (const user of users) {
      await client.query(
        'INSERT INTO users (username, email, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
        [user.username, user.email, user.role]
      );
    }

    console.log('Seed data inserted successfully');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await client.end();
  }
}

seed();
