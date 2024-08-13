import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";


const app=express();
const port=3000;

app.use(express.static("public")); //now whenever i have to use a static file i would mention file path rel to public folder
app.use(bodyParser.urlencoded({extended: true}));   //middleware to parse the form data

let posts=[]; //for memory storage of posts


/*this function allows u to specify where and how files will be stored 
destination: folder inside your computers diskStorage where uploaded files should be stored
filename: current timestamp + .png extension 
*/
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/"); // Store files in public/uploads
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
    }
});


/*this function makes sure that entered file is a png file and none other than that 
fileFilter: This function filters the files based on their MIME type (which indicates the type of file).
file.mimetype: Checks the type of the file. If it's image/png, the callback function (cb) is called with null (indicating no error) and true (indicating the file is accepted).
else: If the file is not a PNG, an error is passed to the callback, and the file is rejected. */
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/png") {
        cb(null, true);
    } else {
        cb(new Error("Only PNG files are allowed"), false);
    }
};


/* a middleware : combines the storage information(where to store and how to name them) and filter info into one function/middleware called upload*/
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});


    // Error-handling middleware
app.use((err, req, res, next) => {
    if (err.message === "Only PNG files are allowed") {
            res.status(400).send("Only PNG files are allowed");
    } else {
    next(err);
    }
    });




//Routes:

app.get("/",(req,res)=>{
    res.render("index.ejs",{posts});    //modifying the get route of homepage so that whatever is in posts array is passed to index.ejs whenever homepage is accessed
});

app.get("/create",(req,res)=>{
    res.render("create.ejs");
});



app.post("/create",upload.single('picture'),(req,res,next)=>{

    //incase a file other than png is added
    if (req.fileValidationError) {
        return res.status(400).send(req.fileValidationError);
    }

    // Extracting form data from req.body
    const postTitle = req.body.postTitle;
    const postDescription = req.body.postDescription; //req.body.name (in the form)
    const postContent = req.body.postContent;
    const postAuthor=req.body.postAuthor;

    // Creating a new post object with extracted data
    const newPost = {
        id:posts.length+1,         //unique id for every new post calculated by current size of array + 1
        title: postTitle,          // Title from the form
        author:postAuthor,         //Author of the post
        description: postDescription, // Description from the form
        content: postContent.replace(/\n/g, '<br>'),     // Content from the form converted to html at the time of creation
        date: new Date(),          // Current date and time
        filePath: req.file ? `/uploads/${req.file.filename}` : null // Store the path of the uploaded picture
    };

    posts.push(newPost);
    res.redirect("/"); // Redirect to homepage to display the new post


     
});




app.get("/post/:id",(req,res)=>{
       const postId=req.params.id;  //This line extracts the id parameter from the URL. For example, if the user visits the URL /post/1, req.params.id will be 1.
       const specificpost=posts.find(p => p.id == postId); //posts is an array containing posts objects each with properties like id,title etc 
                                                          //This is an arrow function used by the find method to compare each post's id with postId. basically har post ko p ka nam diya find fucntion mein and then comparing every p's id property with postId(id of the post we're looking for)
       //once found that post object is stored in const specificpost

       if(specificpost){   //post's content is raw html so easily rendered inside post.ejs
        res.render("post.ejs",{specificpost});   //rendering the post.ejs to display that specific post and sending that specific post obj(containing all its properties and stuff) to that ejs file
       } 
       else{
        res.status(404).send("Post not found");
       }                                              
});

app.get("/post/:id/delete",(req,res)=>{
    const deletePostId=req.params.id;   //retrieves the id of post to be deleted from the url
    const deletePostIndex=posts.findIndex(p => p.id==deletePostId); //retrieves the index of post that has same id as the post to be deleted
    
    if(deletePostIndex !=-1){
        //post found and can be deleted
        posts.splice(deletePostIndex,1);   //starting from that index pos and deleting 1 element from the array
        res.redirect("/");  //redirecting to homepage
    }
    else{
        res.status(404).send('Post not found');
    }

});

app.get("/post/:id/edit",(req,res)=>{
    const editPostId=req.params.id;
    const editPost=posts.find(p => p.id==editPostId); //retrieves the post with the same id as post the need to be edited

    if(editPost){
        //post found so send that post to edit.ejs so that it can be edited
        
        // Convert <br> back to newlines for editing and good user experience
        editPost.content = editPost.content.replace(/<br\s*\/?>/gi, '\n');
        res.render("edit.ejs",{editPost});
    }
    else{
        res.status(404).send('Post not found');
    }
        
});

app.post("/post/:id/edit",upload.single('newpicture'),(req,res,next)=>{ //we are getting a post req while standing on that route similar to post req when we're on create route
     const idOfEditedPost=req.params.id;     //retrieve the id of post to be edited from url
     const postToBeEdited=posts.find(p=>p.id==idOfEditedPost);    //to get the post thats being edited

     if(postToBeEdited){    //if that post exists
        //post exists
        postToBeEdited.title=req.body.newpostTitle;     //using words title,author,description as these were the names of the properties of posts obj when we passed them in an array so ab all objs in array have properties by these names
        postToBeEdited.author=req.body.newpostAuthor;   //whereas newpostTitle comes from name attribute in edit.ejs form thingsS
        postToBeEdited.description=req.body.newpostDescription;
        postToBeEdited.content=req.body.newpostContent.replace(/\n/g, '<br>'); // Convert newlines to <br> as we'll redirect to post.ejs that wants raw html
        postToBeEdited.filePath=req.file ? `/uploads/${req.file.filename}` : null;

        res.redirect("/post/"+idOfEditedPost);
     }
     else{
            res.status(404).send('Post not found');
     }
});

app.listen(port,()=>{
    console.log("Server running on port 3000");
});