const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const middleware = require('../utils/middleware')
// tehtävä 4.20
// const getTokenFrom = request => {
//   const authorization = request.get('authorization')
//   if (authorization && authorization.startsWith('Bearer ')) {
//     return authorization.replace('Bearer ', '')
//   }
//   return null
// }

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1, id:1 })
  response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) =>{
  const blog = await Blog.findById(request.params.id)
  response.json(blog)
})
  
blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
  const body = request.body

  const user = request.user

  if (! body.title || ! body.url) {
    response.status(400).end()
  } else {

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: typeof body.likes!== "undefined" ? body.likes : 0,
    user: user._id
  })

  const newBlog = await blog.save()
  user.blogs = user.blogs.concat(newBlog._id)
  await user.save()
  newBlog.user = user
  response.status(201).json(newBlog)
  }
  })

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {

  const user = request.user
  const blog = await Blog.findById(request.params.id)

  if (blog.user.toString() === user._id.toString()) {
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
  }
  else {
    return response.status(401).json({ error: 'wrong user: only the user who added the blog can delete it' })
  } 
})

blogsRouter.put('/:id',  middleware.userExtractor, async (request, response) => {

  const body = request.body
  const user = request.user

  const blog = ({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: typeof body.likes!== "undefined" ? body.likes : 0,
    user: user._id
  })

  const updatedBlog= await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  response.json(updatedBlog)
})
  

module.exports = blogsRouter