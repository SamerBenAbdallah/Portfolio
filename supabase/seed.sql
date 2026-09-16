-- Preserves the current Player01 portfolio as initial database content.
-- Existing repository URLs remain valid after migration; future uploads go to
-- the project-media Supabase Storage bucket through /admin.

insert into public.projects (
  title, slug, short_description, full_description, category, project_type,
  cover_image, gallery_images, video_url, video_items, tools, deliverables,
  featured, published, display_order, accent, secondary, longform
)
values
(
  'Khanfes Danfes', 'khanfes-danfes',
  'A Tunisian folklore-inspired strategic card game developed as a complete visual world, from identity and card illustrations to packaging and merchandise.',
  'A Tunisian folklore-inspired strategic card game developed as a complete visual world, from identity and card illustrations to packaging and merchandise.',
  'Personal Identity & Game Design', 'graphic',
  '/assets/projects/graphic/khanfes-logo-background.png',
  '[{"src":"/assets/projects/graphic/khanfes-full-project.webp","alt":"The complete Khanfes Danfes identity, card system, packaging, merchandise, and brochure case study"}]'::jsonb,
  null, '[]'::jsonb,
  array['Illustrator','Photoshop'], array['Identity System','20-Card Deck','Packaging & Merchandise'],
  true, true, 0, '#ff2fdd', '#1717ff', true
),
(
  'B2B Lounge Campaigns', 'b2b-lounge-campaigns',
  'A varied social campaign suite for B2B Lounge, combining live entertainment, cultural programming, music, and sports announcements.',
  'A varied social campaign suite for B2B Lounge, combining live entertainment, cultural programming, music, and sports announcements.',
  'Event & Social Campaign', 'graphic',
  '/assets/projects/graphic/b2b-show-summer.webp',
  '[{"src":"/assets/projects/graphic/b2b-show-summer.webp","alt":"B2B Lounge Show Alarabi summer event artwork"},{"src":"/assets/projects/graphic/b2b-show-burgundy.webp","alt":"B2B Lounge Show Alarabi burgundy event artwork"},{"src":"/assets/projects/graphic/b2b-live-music.webp","alt":"B2B Lounge Walid Cherif live music poster"},{"src":"/assets/projects/graphic/b2b-classic-arabic.webp","alt":"B2B Lounge Arabic entertainment poster"},{"src":"/assets/projects/graphic/b2b-euro-final.webp","alt":"B2B Lounge England versus Spain match poster"}]'::jsonb,
  null, '[]'::jsonb,
  array['Photoshop','Illustrator'], array['Social Key Visuals','Event Posters','Campaign Adaptations'],
  false, true, 1, '#ffd21c', '#dd2b55', false
),
(
  'Aerospace Discovery Day 2.0', 'aerospace-discovery-day-2-0',
  'A cinematic event poster built around discovery, aerospace engineering, and the feeling of looking beyond the horizon.',
  'A cinematic event poster built around discovery, aerospace engineering, and the feeling of looking beyond the horizon.',
  'Event Poster', 'graphic',
  '/assets/projects/graphic/aerospace-discovery-day.webp',
  '[{"src":"/assets/projects/graphic/aerospace-discovery-day.webp","alt":"Aerospace Discovery Day 2.0 cinematic event poster"}]'::jsonb,
  null, '[]'::jsonb,
  array['Photoshop','Illustrator'], array['Hero Poster','Event Artwork','Digital Format'],
  false, true, 2, '#ff722b', '#1d47c9', false
),
(
  'Eid Al-Adha Campaign', 'eid-al-adha-campaign',
  'A playful Eid Al-Adha visual that turns a familiar creative workstation into a bright, character-led holiday scene.',
  'A playful Eid Al-Adha visual that turns a familiar creative workstation into a bright, character-led holiday scene.',
  'Social Campaign', 'graphic',
  '/assets/projects/graphic/eid-al-adha-fbj.webp',
  '[{"src":"/assets/projects/graphic/eid-al-adha-fbj.webp","alt":"Eid Al-Adha social campaign with a sheep at a creative workstation"}]'::jsonb,
  null, '[]'::jsonb,
  array['Photoshop'], array['Key Visual','Social Artwork','Campaign Format'],
  false, true, 3, '#ff2f95', '#6047ce', false
),
(
  'Sports & Entertainment Posters', 'sports-entertainment-posters',
  'A selection of personality-driven promotional posters created for live entertainment, radio, and sports-focused events.',
  'A selection of personality-driven promotional posters created for live entertainment, radio, and sports-focused events.',
  'Poster Design', 'graphic',
  '/assets/projects/graphic/sportissimo-event.webp',
  '[{"src":"/assets/projects/graphic/sportissimo-event.webp","alt":"Sportissimo live entertainment event poster"},{"src":"/assets/projects/graphic/radio-anniversary.webp","alt":"Radio anniversary promotional poster"}]'::jsonb,
  null, '[]'::jsonb,
  array['Photoshop','Illustrator'], array['Event Posters','Artist Artwork','Social Formats'],
  false, true, 4, '#1fe7ff', '#123cc5', false
),
(
  'Pharmacy Retail Advertising', 'pharmacy-retail-advertising',
  'A set of polished pharmacy display campaigns balancing product clarity, brand character, and fast in-store readability.',
  'A set of polished pharmacy display campaigns balancing product clarity, brand character, and fast in-store readability.',
  'Retail Campaign', 'graphic',
  '/assets/projects/graphic/oenobiol-retail.webp',
  '[{"src":"/assets/projects/graphic/oenobiol-retail.webp","alt":"Oenobiol pharmacy retail advertisement"},{"src":"/assets/projects/graphic/berocca-retail.webp","alt":"Berocca pharmacy retail advertisement"},{"src":"/assets/projects/graphic/darphin-retail.webp","alt":"Darphin pharmacy retail landscape advertisement"},{"src":"/assets/projects/graphic/my-variations-retail.webp","alt":"My Variations pharmacy retail advertisement"}]'::jsonb,
  null, '[]'::jsonb,
  array['Photoshop'], array['Portrait Displays','Landscape Display','Retail Adaptations'],
  false, true, 5, '#37f0a1', '#0d7c69', false
),
(
  'Nifty Campaign', 'nifty-campaign',
  'A fast, clean financial product campaign adapted as coordinated landscape and portrait motion pieces.',
  'A fast, clean financial product campaign adapted as coordinated landscape and portrait motion pieces.',
  'Featured Multi-Format Campaign', 'motion',
  '/assets/projects/motion/nifty-landscape.jpg', '[]'::jsonb,
  '/assets/projects/motion/nifty-landscape.mp4',
  '[{"title":"Nifty Landscape","src":"/assets/projects/motion/nifty-landscape.mp4","poster":"/assets/projects/motion/nifty-landscape.jpg","duration":"00:08"},{"title":"Nifty Portrait","src":"/assets/projects/motion/nifty-portrait.mp4","poster":"/assets/projects/motion/nifty-portrait.jpg","duration":"00:08"}]'::jsonb,
  array['After Effects','Premiere Pro'], array['Landscape Film','Portrait Reel','Campaign System'],
  true, true, 6, '#b688ff', '#6b29bb', false
),
(
  'Wellness & Everyday Care', 'wellness-everyday-care',
  'A broad set of short-form wellness campaigns with clear product storytelling, quick pacing, and platform-ready portrait layouts.',
  'A broad set of short-form wellness campaigns with clear product storytelling, quick pacing, and platform-ready portrait layouts.',
  'Social Reels', 'motion',
  '/assets/projects/motion/wellbeing.jpg', '[]'::jsonb,
  '/assets/projects/motion/wellbeing.mp4',
  '[{"title":"World Wellness Day","src":"/assets/projects/motion/wellbeing.mp4","poster":"/assets/projects/motion/wellbeing.jpg","duration":"00:10"},{"title":"Respire","src":"/assets/projects/motion/respire.mp4","poster":"/assets/projects/motion/respire.jpg","duration":"00:08"},{"title":"Bonjour Drinks","src":"/assets/projects/motion/bonjour-drinks.mp4","poster":"/assets/projects/motion/bonjour-drinks.jpg","duration":"00:12"},{"title":"Cinq sur Cinq","src":"/assets/projects/motion/cinq-sur-cinq.mp4","poster":"/assets/projects/motion/cinq-sur-cinq.jpg","duration":"00:12"},{"title":"Wellness Mix","src":"/assets/projects/motion/wellness-mix.mp4","poster":"/assets/projects/motion/wellness-mix.jpg","duration":"00:08"},{"title":"Sun Care","src":"/assets/projects/motion/sun-care.mp4","poster":"/assets/projects/motion/sun-care.jpg","duration":"00:12"},{"title":"Tisane Richter","src":"/assets/projects/motion/tisane-richter.mp4","poster":"/assets/projects/motion/tisane-richter.jpg","duration":"00:08"},{"title":"Yogi Tea","src":"/assets/projects/motion/yogi-tea.mp4","poster":"/assets/projects/motion/yogi-tea.jpg","duration":"00:08"},{"title":"Phytosun","src":"/assets/projects/motion/phytosun.mp4","poster":"/assets/projects/motion/phytosun.jpg","duration":"00:08"}]'::jsonb,
  array['After Effects','Premiere Pro'], array['9 Social Reels','Product Callouts','Vertical Exports'],
  false, true, 7, '#ffd21c', '#075b42', false
),
(
  'Product Advertising', 'product-advertising',
  'Nine product-focused campaign films using branded composition, readable benefit callouts, and format-aware motion design.',
  'Nine product-focused campaign films using branded composition, readable benefit callouts, and format-aware motion design.',
  'Animated Retail Campaigns', 'motion',
  '/assets/projects/motion/upsa-landscape.jpg', '[]'::jsonb,
  '/assets/projects/motion/upsa-landscape.mp4',
  '[{"title":"UPSA PeptiFort","src":"/assets/projects/motion/upsa-landscape.mp4","poster":"/assets/projects/motion/upsa-landscape.jpg","duration":"00:08"},{"title":"Good Goût","src":"/assets/projects/motion/good-gout.mp4","poster":"/assets/projects/motion/good-gout.jpg","duration":"00:08"},{"title":"Milical","src":"/assets/projects/motion/milical.mp4","poster":"/assets/projects/motion/milical.jpg","duration":"00:08"},{"title":"Uriage - August","src":"/assets/projects/motion/uriage-august.mp4","poster":"/assets/projects/motion/uriage-august.jpg","duration":"00:08"},{"title":"Phyto","src":"/assets/projects/motion/phyto.mp4","poster":"/assets/projects/motion/phyto.jpg","duration":"00:08"},{"title":"Marvis","src":"/assets/projects/motion/marvis.mp4","poster":"/assets/projects/motion/marvis.jpg","duration":"00:08"},{"title":"Uriage - March","src":"/assets/projects/motion/uriage-march.mp4","poster":"/assets/projects/motion/uriage-march.jpg","duration":"00:08"},{"title":"Pampers Landscape","src":"/assets/projects/motion/pampers-landscape.mp4","poster":"/assets/projects/motion/pampers-landscape.jpg","duration":"00:08"},{"title":"Mavala","src":"/assets/projects/motion/mavala.mp4","poster":"/assets/projects/motion/mavala.jpg","duration":"00:08"}]'::jsonb,
  array['After Effects','Premiere Pro'], array['9 Product Films','Portrait Displays','Landscape Displays'],
  false, true, 8, '#1fe7ff', '#123cc5', false
),
(
  'Healthcare Services', 'healthcare-services',
  'Short service and awareness pieces that make healthcare messages approachable, clear, and easy to scan on digital displays.',
  'Short service and awareness pieces that make healthcare messages approachable, clear, and easy to scan on digital displays.',
  'Awareness & Service Motion', 'motion',
  '/assets/projects/motion/blue-march.jpg', '[]'::jsonb,
  '/assets/projects/motion/blue-march.mp4',
  '[{"title":"Blue March","src":"/assets/projects/motion/blue-march.mp4","poster":"/assets/projects/motion/blue-march.jpg","duration":"00:08"},{"title":"Medadom","src":"/assets/projects/motion/medadom.mp4","poster":"/assets/projects/motion/medadom.jpg","duration":"00:08"},{"title":"Orthopedics","src":"/assets/projects/motion/orthopedics.mp4","poster":"/assets/projects/motion/orthopedics.jpg","duration":"00:08"}]'::jsonb,
  array['After Effects','Premiere Pro'], array['Awareness Reel','Service Explainer','Square Display'],
  false, true, 9, '#ff2f95', '#7c4dff', false
),
(
  'Pharmacy Presentations', 'pharmacy-presentations',
  'Longer presentation-led motion pieces that introduce pharmacy identities, environments, services, and customer experience.',
  'Longer presentation-led motion pieces that introduce pharmacy identities, environments, services, and customer experience.',
  'Brand Presentation Films', 'motion',
  '/assets/projects/motion/espace-bocaud-presentation.jpg', '[]'::jsonb,
  '/assets/projects/motion/espace-bocaud-presentation.mp4',
  '[{"title":"Espace Bocaud Presentation","src":"/assets/projects/motion/espace-bocaud-presentation.mp4","poster":"/assets/projects/motion/espace-bocaud-presentation.jpg","duration":"00:50"},{"title":"Sainte Marthe Presentation","src":"/assets/projects/motion/sainte-marthe-presentation.mp4","poster":"/assets/projects/motion/sainte-marthe-presentation.jpg","duration":"01:11"}]'::jsonb,
  array['After Effects','Premiere Pro'], array['Portrait Presentation','Landscape Presentation','Edited Sequences'],
  false, true, 10, '#37f0a1', '#075b42', false
)
on conflict (slug) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  full_description = excluded.full_description,
  category = excluded.category,
  project_type = excluded.project_type,
  cover_image = excluded.cover_image,
  gallery_images = excluded.gallery_images,
  video_url = excluded.video_url,
  video_items = excluded.video_items,
  tools = excluded.tools,
  deliverables = excluded.deliverables,
  featured = excluded.featured,
  published = excluded.published,
  display_order = excluded.display_order,
  accent = excluded.accent,
  secondary = excluded.secondary,
  longform = excluded.longform;
