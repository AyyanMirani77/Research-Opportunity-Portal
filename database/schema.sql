CREATE DATABASE IF NOT EXISTS research_portal CHARACTER SET utf8mb4;
USE research_portal;

CREATE TABLE IF NOT EXISTS opportunities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  research_area VARCHAR(100) NOT NULL,
  faculty_name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  required_skills VARCHAR(300) NOT NULL,
  positions INT NOT NULL DEFAULT 1,
  deadline DATE NOT NULL,
  status ENUM('Open','Closed') NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO opportunities (title, description, research_area, faculty_name, department, required_skills, positions, deadline, status) VALUES
('Satellite-Based Site Prediction', 'Apply machine learning to satellite imagery to predict archaeological site locations.', 'Machine Learning', 'Dr. Ayesha Khan', 'Computer Science', 'Python, scikit-learn, GIS', 2, '2026-12-15', 'Open'),
('Urdu Speech Recognition', 'Build an Urdu-English code-switching speech recognition model.', 'Natural Language Processing', 'Dr. Bilal Ahmed', 'Software Engineering', 'Python, PyTorch, Audio Processing', 3, '2026-11-30', 'Open');
