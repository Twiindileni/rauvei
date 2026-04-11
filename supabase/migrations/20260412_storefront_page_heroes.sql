-- Editable hero images for About, Contact, and collection listing pages (beyond home hero).

insert into public.page_content (key, label, value, type, section) values
  ('about_hero_image_url',   'About page — hero image URL',   '/about_hero_boutique_interior_1775823933228.png', 'image_url', 'about_page'),
  ('contact_hero_image_url', 'Contact page — hero image URL', '/hero.png',                                       'image_url', 'contact_page'),
  ('collection_hero_women',           'Women''s collection — hero image URL',           '/lau3.jpg',    'image_url', 'collections'),
  ('collection_hero_men',             'Men''s collection — hero image URL',             '/lau1.jpg',    'image_url', 'collections'),
  ('collection_hero_accessories',     'Accessories collection — hero image URL',        '/lauvei.png',  'image_url', 'collections'),
  ('collection_hero_limited_edition', 'Limited edition collection — hero image URL',    '/lau3.jpg',    'image_url', 'collections')
on conflict (key) do nothing;
