-- SQL to create materials tables for RAG functionality
-- Run this manually in your MySQL database

CREATE TABLE materials_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    s3_key VARCHAR(512) NULL,
    source_type ENUM('manual', 'pdf') NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE materials_chunks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    page_number INT NULL,
    heading VARCHAR(255) NULL,
    keywords VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES materials_documents(id) ON DELETE CASCADE
);

