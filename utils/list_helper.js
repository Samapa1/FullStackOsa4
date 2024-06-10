const blog = require("../models/blog")

const dummy = (blogs) => {
    return 1
  }
  
const totalLikes = (blogs) => {
    const reducer = (sum, blog) => {
        return sum + Number(blog.likes)
      }
    
      return blogs.reduce(reducer, 0) 
}

const favoriteBlog= (blogs) => {
    const reducer = (favorite, blog) => {
        if (favorite.likes >blog.likes) {
            return favorite
        }
        return blog
    }
    return blogs.reduce(reducer, blogs[0])
} 

const mostBlogs= (blogs) => {
    let writers = []
    blogs.forEach((blog) => {writers.push(blog.author)
    })


    let duplicates = []
   
    writers.forEach((writer) => { if (! duplicates.find((duplicate) => duplicate.author === writer))
        duplicates.push({author: writer, blogs: 1})
        else {
            const foundAuthor = duplicates.find((duplicate) => duplicate.author === writer)
            foundAuthor.blogs += 1
        }
    })
   
    const reducer = (mosttexts, writer) => {
        if (mosttexts.blogs > writer.blogs) {
            return mosttexts
        }
        return writer
    }
    
    return duplicates.reduce(reducer, duplicates[0])
    
}

const mostLikes = (blogs) => {
    let writers = []

    blogs.forEach((blog) => { if (! writers.find((writer) => blog.author === writer.author))
        writers.push({author: blog.author, likes: blog.likes})
        else {
            const foundAuthor = writers.find((writer) => writer.author === blog.author)
            foundAuthor.likes += blog.likes
        }
    })

    const reducer = (mostlikes, writer) => {
        if (mostlikes.likes > writer.likes) {
            return mostlikes
        }
        return writer
    }
    
    return writers.reduce(reducer, writers[0])

}

module.exports = {
    dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes
  }