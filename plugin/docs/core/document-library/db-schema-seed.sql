-- Document Library Taxonomy Seed Data
-- Initialize the document taxonomy system

-- Register document categories taxonomy
INSERT INTO taxonomies (id, name, feature, description) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'document_categories', 'documents', 'Document categorization and organization system');

-- Seed basic document taxonomy terms
INSERT INTO taxonomy_terms (id, taxonomy_id, name, slug, taxonomy_type, sort_order) VALUES 
-- Document Types
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'HR Policies', 'hr-policies', 'document_type', 1),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'IT Procedures', 'it-procedures', 'document_type', 2),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Finance Templates', 'finance-templates', 'document_type', 3),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Standard Operating Procedures', 'sop', 'document_type', 4),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'Employee Handbooks', 'handbooks', 'document_type', 5),

-- Team Categories
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Engineering Team', 'engineering-team', 'team', 10),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'Marketing Team', 'marketing-team', 'team', 11),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'Sales Team', 'sales-team', 'team', 12),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', 'Operations Team', 'operations-team', 'team', 13),

-- Department Categories
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', 'Human Resources', 'hr-department', 'department', 20),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', 'Information Technology', 'it-department', 'department', 21),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', 'Finance & Accounting', 'finance-department', 'department', 22),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440000', 'Legal & Compliance', 'legal-department', 'department', 23);

-- Seed basic document tags
INSERT INTO document_tags (id, name) VALUES 
('660e8400-e29b-41d4-a716-446655440001', 'policy'),
('660e8400-e29b-41d4-a716-446655440002', 'procedure'),
('660e8400-e29b-41d4-a716-446655440003', 'template'),
('660e8400-e29b-41d4-a716-446655440004', 'handbook'),
('660e8400-e29b-41d4-a716-446655440005', 'onboarding'),
('660e8400-e29b-41d4-a716-446655440006', 'compliance'),
('660e8400-e29b-41d4-a716-446655440007', 'security'),
('660e8400-e29b-41d4-a716-446655440008', 'training'),
('660e8400-e29b-41d4-a716-446655440009', 'reference'),
('660e8400-e29b-41d4-a716-446655440010', 'urgent');
