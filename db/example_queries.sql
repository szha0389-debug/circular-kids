-- List all tables.
.tables

-- Show repair outcomes by product category.
SELECT display_name, total_cases, fixed_cases, repairable_cases, end_of_life_cases
FROM category_repair_summary
WHERE total_cases > 0
ORDER BY total_cases DESC
LIMIT 20;

-- Show repair statistics for headphones.
SELECT * FROM category_repair_summary WHERE display_name = 'Headphones';

-- Show materials associated with the toy category.
SELECT DISTINCT m.name
FROM materials m
JOIN product_materials pm ON pm.material_id = m.id
JOIN product_categories c ON c.id = pm.product_category_id
WHERE LOWER(c.display_name) = 'toy'
ORDER BY m.name;

-- List safety recalls.
SELECT title, original_category, published_at, recall_url
FROM safety_recalls
ORDER BY published_at DESC;

-- Show the most common Open Images label MIDs.
SELECT label_mid, COUNT(*) AS annotation_count
FROM image_annotations
GROUP BY label_mid
ORDER BY annotation_count DESC
LIMIT 20;

-- List completed investigations.
SELECT id, item_name, suspected_problem, child_verdict, evidence_conclusion, completed_at
FROM investigations
WHERE status = 'completed'
ORDER BY completed_at DESC;
