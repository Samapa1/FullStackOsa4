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

  await Blog.deleteMany({})
  let blogObject = new Blog(helper.testBlogs[0])
  await blogObject.save()
  blogObject = new Blog(helper.testBlogs[1])
  await blogObject.save()
  blogObject = new Blog(helper.testBlogs[2])
  await blogObject.save()
})

const authenticateUser =  async (user) => {
  console.log(user)
    const userForToken = {
        username: user.username,
        id: user.id,
      }
    
    const token = jwt.sign(userForToken, process.env.SECRET)
    console.log(token)

    if (!token) {
      console.log("virhe")
      response.status(401).end()
    }
    else {
      console.log(token)
      return (`Bearer ${token}`)
    }
}

// before(async () => {
// // Luo user ja poista ehkä ennen
//   await User.deleteMany({})
//   let testUser = new User({ "username": "TiinaT",
//     "name": "Tiina",
//     "password": "kokeilu"
//   })
//   await testUser.save()

// })


// .set('Authorization', 'abc123') // Works.

  
test.only('returns blogs as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test.only('returns five blogs', async () => {
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
  console.log("heihei")
  console.log(user)

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

test('if likes is not defined, it will have value of 0', async () => {
  const newBlog = {
    title: "TDD harms architecture",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
}

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)

  const response = await api.get('/api/blogs')

  const contents = response.body.find(blog => blog.title === "TDD harms architecture")

  assert.strictEqual(response.body.length, helper.testBlogs.length + 1)
  assert.strictEqual(contents.likes, 0)


})  

test('if title is not defined, response is "400 Bad Request"', async () => {
  const newBlog = {
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
    likes: 2
}

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  const response = await api.get('/api/blogs')

  assert.strictEqual(response.body.length, helper.testBlogs.length)


})  

test('if url is not defined, response is "400 Bad Request"', async () => {
  const newBlog = {
    title: "Type wars",
    author: "Robert C. Martin",
    likes: 2
}

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  const response = await api.get('/api/blogs')

  assert.strictEqual(response.body.length, helper.testBlogs.length)

})  

test('a blog can be deleted', async () => {
  // const blogToDelete = helper.testBlogs[0]
  const response1 = await api.get('/api/blogs')
  const blogToDelete = response1.body[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const response2 = await api.get('/api/blogs')
  assert.strictEqual(response2.body.length, helper.testBlogs.length-1)
})

test('a blog can be updated', async () => {
  const blogToUpdate = helper.testBlogs[0]

  const updated= {
    title: blogToUpdate.title,
    author: blogToUpdate.author,
    url: blogToUpdate.url,
    likes: 13
}

  await api
    .put(`/api/blogs/${blogToUpdate._id}`)
    .send(updated)
    .expect(200)

  const response = await api.get(`/api/blogs/${blogToUpdate._id}`)

  assert.strictEqual(response.body.likes, 13)
})

after(async () => {
  await mongoose.connection.close()
})



// const createTestUser = async () => {
//     const saltRounds = 10
//     // const passwordHash = await bcrypt.hash(vadelma, saltRounds)
  
//     const user = new User({
//         username: "TiinaT",
//         name: "Tiina Testaaja",
//         passwordHash: await bcrypt.hash("vadelma", saltRounds)
//     })
  
//     const savedUser = await user.save()
    
//     console.log(savedUser)
//     const testUser = await User.findOne({savedUser})
// }