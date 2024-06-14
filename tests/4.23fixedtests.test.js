const { test, after, beforeEach, before } = require('node:test')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const supertest = require('supertest')
const assert = require('node:assert')

const app = require('../app')
const api = supertest(app)


const Blog = require('../models/blog')
const helper = require('./test_helper')
const User = require('../models/user')


beforeEach(async () => {
  await User.deleteMany({})
  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ username: 'ellap', passwordHash })
  await user.save()
  const usersinDb = await helper.usersInDatabase()
  const savedUser = usersinDb[0]
  const userId = {user: savedUser.id.toString()}
 
  await Blog.deleteMany({})
  let blogData1 = {...helper.testBlogs[0], ...userId}
  let blogObject1 = new Blog(blogData1)
  await blogObject1.save()
  let blogData2 = {...helper.testBlogs[1], ...userId}
  let blogObject2 = new Blog(blogData2)
  await blogObject2.save()
  let blogData3 = {...helper.testBlogs[2], ...userId}
  let blogObject3 = new Blog(blogData3)
  await blogObject3.save()
})

const authenticateUser =  async (user) => {

    const userForToken = {
        username: user.username,
        id: user.id,
      }
    
    const token = jwt.sign(userForToken, process.env.SECRET)

    return (`Bearer ${token}`)
}
  
test('returns blogs as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('returns five blogs', async () => {
    const response =  await api.get('/api/blogs')
    assert.strictEqual(response.body.length, helper.testBlogs.length)
})

test('blogs identified with id instead of _id', async () => {
    const response =  await api.get('/api/blogs')
    let correctIds = 0

    const correctId = (blog) => { if (blog.id) {
            correctIds += 1
            }
    }

    response.body.forEach((blog) => correctId(blog))

    assert.strictEqual(correctIds, helper.testBlogs.length)
})

test('a new blog can be added ', async () => {
  const usersinDb = await helper.usersInDatabase()
  const user = usersinDb[0]
  
    const newBlog = {
        title: "Type wars",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
        likes: 2,
        userId: user.id
    }

    const authenticatedUser = await authenticateUser(user)

    await api
      .post('/api/blogs')
      .set({'Authorization':authenticatedUser}) 
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
      
  
    const response = await api.get('/api/blogs')
  
    const contents = response.body.map(blog => blog.title)
  
    assert.strictEqual(response.body.length, helper.testBlogs.length + 1)
  
    assert(contents.includes('Type wars'))
  })

test('a new blog can not be added without token', async () => {
  const user = {username: "Otto", id: "12121212"}

    const newBlog = {
        title: "Type wars",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
        likes: 2,
        userId: user.id
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)
      
  
    const response = await api.get('/api/blogs')
  
    assert.strictEqual(response.body.length, helper.testBlogs.length)
  })

test('if likes is not defined, it will have value of 0', async () => {
  const usersinDb = await helper.usersInDatabase()
  const user = usersinDb[0]

  const newBlog = {
    title: "TDD harms architecture",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
    userId: user.id
}

  const authenticatedUser = await authenticateUser(user)

  await api
    .post('/api/blogs')
    .set({'Authorization':authenticatedUser}) 
    .send(newBlog)
    .expect(201)

  const response = await api.get('/api/blogs')

  const contents = response.body.find(blog => blog.title === "TDD harms architecture")

  assert.strictEqual(response.body.length, helper.testBlogs.length + 1)
  assert.strictEqual(contents.likes, 0)


})  

test('if title is not defined, response is "400 Bad Request"', async () => {
  const usersinDb = await helper.usersInDatabase()
  const user = usersinDb[0]

  const newBlog = {
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
    likes: 2,
    userId: user.id
}

  const authenticatedUser = await authenticateUser(user)  

  await api
    .post('/api/blogs')
    .set({'Authorization':authenticatedUser}) 
    .send(newBlog)
    .expect(400)

  const response = await api.get('/api/blogs')

  assert.strictEqual(response.body.length, helper.testBlogs.length)


})  

test('if url is not defined, response is "400 Bad Request"', async () => {
  const usersinDb = await helper.usersInDatabase()
  const user = usersinDb[0]

  const newBlog = {
    title: "Type wars",
    author: "Robert C. Martin",
    likes: 2,
    userId: user.id
  } 

  const authenticatedUser = await authenticateUser(user)  

  await api
    .post('/api/blogs')
    .set({'Authorization':authenticatedUser}) 
    .send(newBlog)
    .expect(400)

  const response = await api.get('/api/blogs')

  assert.strictEqual(response.body.length, helper.testBlogs.length)

})  

test('a blog can be deleted', async () => {
  const usersinDb = await helper.usersInDatabase()
  const user = usersinDb[0]

  const authenticatedUser = await authenticateUser(user)  
  const response1 = await api.get('/api/blogs')
  const blogToDelete = response1.body[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set({'Authorization':authenticatedUser}) 
    .expect(204)

  const response2 = await api.get('/api/blogs')
  assert.strictEqual(response2.body.length, helper.testBlogs.length-1)
})

test('a blog can be updated', async () => {
  const usersinDb = await helper.usersInDatabase()
  const user = usersinDb[0]

  const authenticatedUser = await authenticateUser(user)
  const blogToUpdate = helper.testBlogs[0]

  const updated= {
    title: blogToUpdate.title,
    author: blogToUpdate.author,
    url: blogToUpdate.url,
    likes: 13,
  }

  await api
    .put(`/api/blogs/${blogToUpdate._id}`)
    .set({'Authorization':authenticatedUser}) 
    .send(updated)
    .expect(200)

  const response = await api.get(`/api/blogs/${blogToUpdate._id}`)

  assert.strictEqual(response.body.likes, 13)
})

after(async () => {
  await mongoose.connection.close()
})

