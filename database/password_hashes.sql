-- Password Hashing untuk Default Users
-- Gunakan bcrypt hash untuk password "admin123"

-- Update password untuk user admin (hash untuk "admin123")
UPDATE users 
SET password = '$2b$10$K7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8Z'
WHERE username = 'admin';

-- Update password untuk user guru1 (hash untuk "admin123")  
UPDATE users 
SET password = '$2b$10$K7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8Z'
WHERE username = 'guru1';

-- Update password untuk user guru2 (hash untuk "admin123")
UPDATE users 
SET password = '$2b$10$K7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8Z'
WHERE username = 'guru2';

-- Update password untuk user guru3 (hash untuk "admin123")
UPDATE users 
SET password = '$2b$10$K7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8Z'
WHERE username = 'guru3';

-- Update password untuk user guru4 (hash untuk "admin123")
UPDATE users 
SET password = '$2b$10$K7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8Z'
WHERE username = 'guru4';

-- Note: Hash di atas adalah contoh. Dalam production, gunakan hash yang benar dari bcrypt.
-- Untuk generate hash baru, gunakan Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = bcrypt.hashSync('admin123', 10);
-- console.log(hash);