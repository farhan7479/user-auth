import request from 'supertest';
import bcrypt from 'bcrypt';
import createTestApp from './test-app';
import TestDatabase from './test-database';
import { Application } from 'express';

const app: Application = createTestApp();

describe('🔐 Auth Integration Tests (Real Database)', () => {
  beforeAll(async () => {
    // Connect to test database
    await TestDatabase.connect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await TestDatabase.cleanup();
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await TestDatabase.cleanup();
    await TestDatabase.disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Check API response
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.id).toBeTruthy();
      expect(response.body.data.createdAt).toBeTruthy();

      // Verify user was actually created in database
      const prisma = TestDatabase.getPrisma();
      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(userInDb).toBeTruthy();
      expect(userInDb!.email).toBe(userData.email);
      expect(userInDb!.name).toBe(userData.name);
      // Password should be hashed, not plain text
      expect(userInDb!.password).not.toBe(userData.password);
      expect(userInDb!.password.length).toBeGreaterThan(20); // Hashed passwords are long

      // Verify password was hashed correctly
      const isPasswordValid = await bcrypt.compare(userData.password, userInDb!.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required');

      // Verify no user was created
      const prisma = TestDatabase.getPrisma();
      const users = await prisma.user.findMany();
      expect(users).toHaveLength(0);
    });

    it('should return 409 when user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123'
      };

      // Create user first
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to create same user again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');

      // Verify only one user exists
      const prisma = TestDatabase.getPrisma();
      const users = await prisma.user.findMany({
        where: { email: userData.email }
      });
      expect(users).toHaveLength(1);
    });

    it('should handle name as optional field', async () => {
      const userData = {
        email: 'noname@example.com',
        password: 'password123'
        // No name provided
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.name).toBeNull();

      // Verify in database
      const prisma = TestDatabase.getPrisma();
      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      expect(userInDb!.name).toBeNull();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const hashedPassword = await bcrypt.hash('password123', 10);
      await TestDatabase.getPrisma().user.create({
        data: {
          email: 'loginuser@example.com',
          password: hashedPassword,
          name: 'Login User'
        }
      });
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'loginuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Check response structure
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User logged in successfully');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.user.name).toBe('Login User');
      expect(response.body.data.accessToken).toBeTruthy();
      expect(response.body.data.refreshToken).toBeTruthy();

      // Verify JWT tokens are strings and not empty
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(typeof response.body.data.refreshToken).toBe('string');
      expect(response.body.data.accessToken.length).toBeGreaterThan(10);
      expect(response.body.data.refreshToken.length).toBeGreaterThan(10);
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required');
    });
  });

  describe('GET /api/auth/profile', () => {
    let userToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register and login to get token
      const userData = {
        email: 'profileuser@example.com',
        password: 'password123',
        name: 'Profile User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      userToken = loginResponse.body.data.accessToken;
      userId = loginResponse.body.data.user.id;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe('profileuser@example.com');
      expect(response.body.data.name).toBe('Profile User');
      expect(response.body.data.createdAt).toBeTruthy();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get refresh token
      const userData = {
        email: 'refreshuser@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      console.log('🔍 Testing refresh token...');
      console.log('Refresh token:', refreshToken);
      
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Tokens refreshed successfully');
      expect(response.body.data.accessToken).toBeTruthy();
      expect(response.body.data.refreshToken).toBeTruthy();

      // New tokens should be different from old ones
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should return 400 without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Refresh token is required');
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('🧪 Database Integrity Tests', () => {
    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'unique@example.com',
        password: 'password123'
      };

      // First registration should succeed
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      // Verify only one user exists
      const prisma = TestDatabase.getPrisma();
      const users = await prisma.user.findMany({
        where: { email: userData.email }
      });
      expect(users).toHaveLength(1);
    });

    it('should properly handle concurrent registrations', async () => {
      const userData = {
        email: 'concurrent@example.com',
        password: 'password123'
      };

      // Attempt concurrent registrations
      const promises = Array(3).fill(null).map(() =>
        request(app)
          .post('/api/auth/register')
          .send(userData)
      );

      const responses = await Promise.allSettled(promises);
      
      // Only one should succeed (201), others should fail (409)
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 201
      );
      
      expect(successful).toHaveLength(1);

      // Verify only one user exists in database
      const prisma = TestDatabase.getPrisma();
      const users = await prisma.user.findMany({
        where: { email: userData.email }
      });
      expect(users).toHaveLength(1);
    });
  });
});
