import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
let numStudents = 1000;
let numApplications = 2000;

args.forEach(arg => {
  if (arg.startsWith('--students=')) numStudents = parseInt(arg.split('=')[1], 10);
  if (arg.startsWith('--applications=')) numApplications = parseInt(arg.split('=')[1], 10);
});

const poolConfig = {
  user: process.env.DATABASE_USER || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'aurora_admissions',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  max: 10
};

if (process.env.DATABASE_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Ananya', 'Diya', 'Saanvi', 'Aanya', 'Aadhya', 'Isha', 'Myra', 'Navya', 'Priya', 'Riya'];
const lastNames = ['Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Nair', 'Gupta', 'Joshi', 'Malhotra', 'Iyer', 'Rao', 'Mehta', 'Shah', 'Chopra'];
const cities = [
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  { city: 'Delhi', state: 'Delhi', pincode: '110001' },
  { city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
  { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
  { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
  { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
  { city: 'Kolkata', state: 'West Bengal', pincode: '700001' },
  { city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' }
];
const genders = ['Male', 'Female', 'Other'];
const qualifications = ['12th CBSE', '12th State Board', '12th ICSE', 'Diploma in Engineering', 'Higher Secondary'];
const applicationTypes = ['REGULAR', 'LATERAL', 'MANAGEMENT', 'NRI'];
const statuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

async function run() {
  const client = await pool.connect();
  try {
    console.log(`Starting data generation: target ${numStudents} students, ${numApplications} applications.`);
    console.log(`Connected to database "${poolConfig.database}" at ${poolConfig.host}:${poolConfig.port}`);
    
    // Fetch available courses
    const crsRes = await client.query('SELECT id FROM courses WHERE is_active = true');
    if (crsRes.rows.length === 0) {
      throw new Error('No active courses found in database. Please run database/seed.sql or database/schema.sql first.');
    }
    const courseIds = crsRes.rows.map(r => r.id);
    console.log(`Found ${courseIds.length} active courses for application enrollment.`);

    const batchSize = 500;
    let studentsInserted = 0;
    const studentIds = [];
    
    console.log('Generating students in batches...');
    for (let i = 0; i < numStudents; i += batchSize) {
      const limit = Math.min(batchSize, numStudents - i);
      const values = [];
      let queryStr = 'INSERT INTO students (full_name, email, phone, date_of_birth, gender, address, city, state, pincode) VALUES ';
      
      for (let j = 0; j < limit; j++) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        const loc = cities[Math.floor(Math.random() * cities.length)];
        const gender = genders[Math.floor(Math.random() * genders.length)];
        const uniqueSuffix = `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}${i + j}`;
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${uniqueSuffix}@example.com`;
        const phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
        
        const birthYear = 2002 + Math.floor(Math.random() * 5);
        const birthMonth = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
        const birthDay = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
        const dob = `${birthYear}-${birthMonth}-${birthDay}`;

        values.push(`${fn} ${ln}`, email, phone, dob, gender, `${j + 1}, University Enclave Road`, loc.city, loc.state, loc.pincode);
        
        const offset = j * 9;
        queryStr += `($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5}, $${offset+6}, $${offset+7}, $${offset+8}, $${offset+9})${j === limit - 1 ? '' : ','}`;
      }
      queryStr += ' RETURNING id';
      
      const insertRes = await client.query(queryStr, values);
      insertRes.rows.forEach(r => studentIds.push(r.id));
      studentsInserted += limit;
      console.log(`  Inserted ${studentsInserted} / ${numStudents} students...`);
    }

    if (numApplications > 0 && studentIds.length > 0) {
      console.log('Generating admission applications and audit events in batches...');
      let appsInserted = 0;
      const datePrefix = new Date().toISOString().replace(/-/g, '').slice(0, 8);

      for (let i = 0; i < numApplications; i += batchSize) {
        const limit = Math.min(batchSize, numApplications - i);
        const values = [];
        let queryStr = 'INSERT INTO applications (application_number, student_id, course_id, academic_year, previous_qualification, percentage, application_type, status) VALUES ';
        
        for (let j = 0; j < limit; j++) {
          const sid = studentIds[Math.floor(Math.random() * studentIds.length)];
          const cid = courseIds[Math.floor(Math.random() * courseIds.length)];
          const appNum = `APP-${datePrefix}-${String(i + j + 1).padStart(5, '0')}`;
          const qual = qualifications[Math.floor(Math.random() * qualifications.length)];
          const percentage = (60 + Math.random() * 38).toFixed(2);
          const appType = applicationTypes[Math.floor(Math.random() * applicationTypes.length)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          values.push(appNum, sid, cid, '2024-2025', qual, percentage, appType, status);
          const offset = j * 8;
          queryStr += `($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5}, $${offset+6}, $${offset+7}, $${offset+8})${j === limit - 1 ? '' : ','}`;
        }
        queryStr += ' RETURNING id, status';

        await client.query('BEGIN');
        const appRes = await client.query(queryStr, values);
        
        // Insert corresponding audit log events
        const eventValues = [];
        let eventQueryStr = 'INSERT INTO application_events (application_id, event_type, new_status, description) VALUES ';
        for (let k = 0; k < appRes.rows.length; k++) {
          const row = appRes.rows[k];
          eventValues.push(row.id, 'CREATED', row.status, 'Application imported through test data generator');
          const off = k * 4;
          eventQueryStr += `($${off+1}, $${off+2}, $${off+3}, $${off+4})${k === appRes.rows.length - 1 ? '' : ','}`;
        }
        await client.query(eventQueryStr, eventValues);
        await client.query('COMMIT');

        appsInserted += limit;
        console.log(`  Inserted ${appsInserted} / ${numApplications} applications + events...`);
      }
    }
    
    console.log('\nSUCCESS: Test data generation complete!');
    console.log(`Summary: ${studentsInserted} students and ${numApplications} applications created.`);
  } catch (err) {
    console.error('Error generating data:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
