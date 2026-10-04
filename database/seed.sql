-- database/seed.sql

-- Insert Courses
INSERT INTO courses (id, name, code, description, duration_years) VALUES
(gen_random_uuid(), 'Computer Science and Engineering', 'CSE', 'B.Tech in Computer Science and Engineering', 4),
(gen_random_uuid(), 'Artificial Intelligence and Machine Learning', 'AIML', 'B.Tech in AI and ML', 4),
(gen_random_uuid(), 'Data Science', 'DS', 'B.Tech in Data Science', 4),
(gen_random_uuid(), 'Electronics and Communication Engineering', 'ECE', 'B.Tech in Electronics and Communication Engineering', 4),
(gen_random_uuid(), 'Mechanical Engineering', 'ME', 'B.Tech in Mechanical Engineering', 4),
(gen_random_uuid(), 'Civil Engineering', 'CE', 'B.Tech in Civil Engineering', 4)
ON CONFLICT (code) DO NOTHING;

-- Insert Students
INSERT INTO students (full_name, email, phone, date_of_birth, gender, address, city, state, pincode) VALUES
('Aarav Patel', 'aarav.patel@example.com', '9876543210', '2004-05-15', 'Male', '123 MG Road', 'Mumbai', 'Maharashtra', '400001'),
('Diya Sharma', 'diya.sharma@example.com', '9876543211', '2005-02-20', 'Female', '45 Brigade Road', 'Bangalore', 'Karnataka', '560001'),
('Vihaan Kumar', 'vihaan.k@example.com', '9876543212', '2003-11-10', 'Male', '78 Anna Salai', 'Chennai', 'Tamil Nadu', '600002'),
('Ananya Singh', 'ananya.singh@example.com', '9876543213', '2004-08-25', 'Female', '12 Connaught Place', 'New Delhi', 'Delhi', '110001'),
('Arjun Reddy', 'arjun.reddy@example.com', '9876543214', '2004-01-30', 'Male', '34 Jubilee Hills', 'Hyderabad', 'Telangana', '500033'),
('Ishita Gupta', 'ishita.g@example.com', '9876543215', '2005-06-12', 'Female', '56 Park Street', 'Kolkata', 'West Bengal', '700016'),
('Sai Krishna', 'sai.krishna@example.com', '9876543216', '2003-09-18', 'Male', '89 KPHB', 'Hyderabad', 'Telangana', '500072'),
('Priya Desai', 'priya.desai@example.com', '9876543217', '2004-12-05', 'Female', '23 CG Road', 'Ahmedabad', 'Gujarat', '380009'),
('Kabir Das', 'kabir.das@example.com', '9876543218', '2004-03-22', 'Male', '67 Koregaon Park', 'Pune', 'Maharashtra', '411001'),
('Neha Verma', 'neha.verma@example.com', '9876543219', '2005-07-14', 'Female', '90 Sector 17', 'Chandigarh', 'Chandigarh', '160017'),
('Rohan Mehra', 'rohan.mehra@example.com', '9876543220', '2004-10-08', 'Male', '45 Mall Road', 'Shimla', 'Himachal Pradesh', '171001'),
('Kavya Iyer', 'kavya.iyer@example.com', '9876543221', '2003-04-16', 'Female', '12 TTK Road', 'Chennai', 'Tamil Nadu', '600018'),
('Vivaan Joshi', 'vivaan.joshi@example.com', '9876543222', '2005-01-27', 'Male', '34 Civil Lines', 'Jaipur', 'Rajasthan', '302006'),
('Riya Kapoor', 'riya.kapoor@example.com', '9876543223', '2004-09-02', 'Female', '78 Linking Road', 'Mumbai', 'Maharashtra', '400050'),
('Aditya Nair', 'aditya.nair@example.com', '9876543224', '2004-06-19', 'Male', '56 MG Road', 'Kochi', 'Kerala', '682016'),
('Myra Reddy', 'myra.reddy@example.com', '9876543225', '2005-11-11', 'Female', '90 Whitefield', 'Bangalore', 'Karnataka', '560066'),
('Krishna Yadav', 'krishna.yadav@example.com', '9876543226', '2003-12-25', 'Male', '23 Gomti Nagar', 'Lucknow', 'Uttar Pradesh', '226010'),
('Sanya Malhotra', 'sanya.m@example.com', '9876543227', '2004-07-30', 'Female', '67 Indiranagar', 'Bangalore', 'Karnataka', '560038'),
('Dev Patel', 'dev.patel@example.com', '9876543228', '2004-02-14', 'Male', '12 SG Highway', 'Ahmedabad', 'Gujarat', '380054'),
('Zara Khan', 'zara.khan@example.com', '9876543229', '2005-08-05', 'Female', '45 Banjara Hills', 'Hyderabad', 'Telangana', '500034')
ON CONFLICT (email) DO NOTHING;

-- DO block to generate applications and events dynamically
DO $$
DECLARE
    s_id UUID;
    c_id UUID;
    app_id UUID;
    status_val VARCHAR;
    app_num VARCHAR;
    i INT := 1;
BEGIN
    FOR s_id IN SELECT id FROM students LIMIT 20 LOOP
        SELECT id INTO c_id FROM courses ORDER BY random() LIMIT 1;
        status_val := (ARRAY['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'])[floor(random() * 4 + 1)];
        app_num := 'APP-202405' || lpad(i::text, 5, '0');
        
        INSERT INTO applications (
            application_number, student_id, course_id, academic_year, 
            previous_qualification, percentage, application_type, status
        ) VALUES (
            app_num, s_id, c_id, '2024-2025', 
            '12th Standard', (random() * 40 + 60)::numeric(5,2), 'REGULAR', status_val
        ) RETURNING id INTO app_id;
        
        INSERT INTO application_events (application_id, event_type, new_status, description)
        VALUES (app_id, 'CREATED', 'PENDING', 'Application submitted');
        
        IF status_val != 'PENDING' THEN
            INSERT INTO application_events (application_id, event_type, old_status, new_status, description)
            VALUES (app_id, 'STATUS_CHANGED', 'PENDING', 'UNDER_REVIEW', 'Application is under review');
            
            IF status_val IN ('APPROVED', 'REJECTED') THEN
                INSERT INTO application_events (application_id, event_type, old_status, new_status, description)
                VALUES (app_id, 'STATUS_CHANGED', 'UNDER_REVIEW', status_val, 'Final decision made');
            END IF;
        END IF;
        
        i := i + 1;
    END LOOP;
    
    FOR s_id IN SELECT id FROM students ORDER BY random() LIMIT 10 LOOP
        SELECT id INTO c_id FROM courses ORDER BY random() LIMIT 1;
        status_val := 'PENDING';
        app_num := 'APP-202405' || lpad(i::text, 5, '0');
        
        INSERT INTO applications (
            application_number, student_id, course_id, academic_year, 
            previous_qualification, percentage, application_type, status
        ) VALUES (
            app_num, s_id, c_id, '2024-2025', 
            '12th Standard', (random() * 40 + 60)::numeric(5,2), 'MANAGEMENT', status_val
        ) RETURNING id INTO app_id;
        
        INSERT INTO application_events (application_id, event_type, new_status, description)
        VALUES (app_id, 'CREATED', 'PENDING', 'Application submitted under management quota');
        
        i := i + 1;
    END LOOP;
END $$;
