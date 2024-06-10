//blogien lisääminen testitietokantaan

const mongoose = require('mongoose')

if (process.argv.length<3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const url =
  `mongodb+srv://samapa:${password}@cluster0.nrotuv0.mongodb.net/testBlogApp?retryWrites=true&w=majority&appName=Cluster0`

mongoose.set('strictQuery', false)

mongoose.connect(url).then(()=> {
const blogSchema = mongoose.Schema({
    title: String,
    author: String,
    url: String,
    likes: Number
    })
    
blogSchema.set('toJSON', {
transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
}
}) 
const Blog = mongoose.model('Blog', blogSchema)

const blog = new Blog({
    _id: "5a422aa71b54a676234d17f8",
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
    __v: 0
})

blog.save().then(result => {
    console.log(`blog saved`)
    mongoose.connection.close()
  })

console.log('blogs:')
Blog.find({}).then(result => {
result.forEach(blog=> {
    console.log(`${blog.title} ${blog.author}`)
})
mongoose.connection.close()
})

})