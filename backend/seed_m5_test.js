const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // Create test user
    const userRes = await pool.query(
      'INSERT INTO public.users (username, email) VALUES ($1, $2) ON CONFLICT(email) DO UPDATE SET username = $1 RETURNING id',
      ['organizer_test', 'organizer@test.com']
    );
    const userId = userRes.rows[0].id;
    console.log('✓ User created:', userId);

    // Create free event (physical)
    const evt1 = await pool.query(
      `INSERT INTO module5.events 
       (title, organizer_user_id, description, type, format, privacy, status, 
        location_name, location_address, location_city, location_country, timezone,
        starts_at, ends_at, capacity, is_free, price_amount, currency) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
       RETURNING id, title`,
      ['Roundtable Tech 2026', userId, 'Discussion sur les dernières technos',
       'networking', 'physical', 'public', 'published',
       'Salle Parisienne', '15 Rue de la Tech', 'Paris', 'France', 'Europe/Paris',
       '2026-06-15T10:00:00Z', '2026-06-15T12:00:00Z', 50, true, 0.00, 'MAD']
    );
    console.log('✓ Event 1 (Free):', evt1.rows[0].title);

    // Create paid hybrid event
    const evt2 = await pool.query(
      `INSERT INTO module5.events 
       (title, organizer_user_id, description, type, format, privacy, status,
        location_name, location_address, location_city, location_country, timezone,
        virtual_link, starts_at, ends_at, capacity, is_free, price_amount, currency) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
       RETURNING id, title`,
      ['Meetup Python Payant', userId, 'Workshop Python avancé',
       'workshop', 'hybrid', 'public', 'published',
       'Salle Lyon Tech', '42 Avenue de Python', 'Lyon', 'France', 'Europe/Paris',
       'https://zoom.us/j/123456', '2026-06-20T14:00:00Z', '2026-06-20T16:00:00Z', 30, false, 50.00, 'MAD']
    );
    console.log('✓ Event 2 (Paid Hybrid):', evt2.rows[0].title);

    // Create full capacity event for waitlist test
    const evt3 = await pool.query(
      `INSERT INTO module5.events 
       (title, organizer_user_id, description, type, format, privacy, status,
        location_name, location_address, location_city, location_country, timezone,
        starts_at, ends_at, capacity, is_free, price_amount, currency, waitlist_enabled) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
       RETURNING id, title`,
      ['Conférence Cloud (Complet)', userId, 'Conférence AWS et Azure',
       'conference', 'physical', 'public', 'published',
       'Palais des Congrès', '2 Place Toulouse', 'Toulouse', 'France', 'Europe/Paris',
       '2026-06-25T09:00:00Z', '2026-06-25T17:00:00Z', 3, false, 100.00, 'MAD', true]
    );
    console.log('✓ Event 3 (Paid, At Capacity):', evt3.rows[0].title);

    console.log('\n✓ All test events created successfully!');
    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
})();
