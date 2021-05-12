const express = require("express");
const serverRoutes = require("./app");
const request = require("supertest");
const bodyParser = require('body-parser');

const app = express();


app.use("/states", serverRoutes);
app.use(bodyParser.urlencoded({
    extended: true
}));

const testBlog1 = {
    title : "Blog1",
    desc : "My first blog",
    content : "welcome to my first blog!" 
}

const testBlog2 = {
    title : "Blog2",
    desc : "My first blog",
    content : "welcome to my first blog!" 
}

const testBlog3 = {
    title : "Blog1",
    desc : "My last blog",
    content : "Good bye!" 
}


describe("test suite for Blog API",()=>{

    it("POST /states/register - fail password not match", async ()=>{
        let obj = {
            username: "vrutikrabadia",
            password: "hello",
            confirm: "hi",
        };
        const response = await (await request(app).post("/states/register").type('form').send(obj));
 
        expect(response.res.text).toEqual("Error: confirmation does not matches the password");
    });

    it("POST /states/register - sucess", async ()=>{
        let obj = {
            username: "vrutikrabadia",
            password: "hello",
            confirm: "hello",
        };
        const response = await (await request(app).post("/states/register").type('form').send(obj));
 
        expect(response.res.text).toEqual("User sucessfully reistered!");
    });

    it("POST /states/register - sucess username already taken", async ()=>{
        let obj = {
            username: "vrutikrabadia",
            password: "hello",
            confirm: "hello",
        };
        const response = await (await request(app).post("/states/register").type('form').send(obj));
 
        expect(response.res.text).toEqual("Username already taken");
    });

    it("POST /states/login - fail user not found", async ()=>{
        let obj = {
            username: "vrutikrabadia1",
            password: "hello",
        };
        const response = await (await request(app).post("/states/login").type('form').send(obj));
 
        expect(response.res.text).toEqual("User not found");
    });

    it("POST /states/login - fail invalid password", async ()=>{
        let obj = {
            username: "vrutikrabadia",
            password: "hi",
        };
        const response = await (await request(app).post("/states/login").type('form').send(obj));
 
        expect(response.res.text).toEqual("Incorrect password");
    });

    it("POST /states/login - sucess", async ()=>{
        let obj = {
            username: "vrutikrabadia",
            password: "hello",
        };
        const response = await (await request(app).post("/states/login").type('form').send(obj));
        expect(response.body.token).not.toBeNull();
    });

    it("POST /state/createBlog -fail user not authenticated", async ()=>{
        const response = await (await request(app).post("/states/createBlog").type('form').send(testBlog1));
        expect(response.statusCode).toEqual(401);
    });

    it("POST /state/createBlog -success", async ()=>{
        let obj = {
            username: "vrutikrabadia",
            password: "hello",
        };
        const response = await (await request(app).post("/states/login").type('form').send(obj));
        
        let token = response.body.accessToken;

        const response1 = await (await request(app).post("/states/createBlog").type('form').set('Authorization', `Bearer ${token}`).send(testBlog1));
        expect(response1.res.text).toEqual("Blog Sucesfully saved");
    });

    it("POST /state/listBlogs -sucess", async()=>{
        let obj = {
            username: "vrutikrabadia",
            password: "hello",
        };
        const response = await (await request(app).post("/states/login").type('form').send(obj));
        
        let token = response.body.accessToken;

        const response1 = await (await request(app).get("/states/listBlogs").set('Authorization', `Bearer ${token}`));

        let blog = response1.body[0];
        delete blog._id;
        delete blog.__v;
        delete blog.author;
        expect(blog).toEqual(testBlog1);
    });

    it("POST /state/updateBlog -fail not the author of the blog", async()=>{
        let obj = {
            username: "vrutikrabadia1",
            password: "hello",
            confirm: "hello",
        };

        const response = await (await request(app).post("/states/register").type('form').send(obj));

        let obj1 = {
            username: "vrutikrabadia1",
            password: "hello",
        };
        const response2 = await (await request(app).post("/states/login").type('form').send(obj1));
        
        let token = response2.body.accessToken;

        const response1 = await (await request(app).post("/states/updateBlog").type('form').set('Authorization', `Bearer ${token}`).send(testBlog1));
        expect(response1.res.text).toEqual("No such blog is created by you!");
    });

    it("POST /state/updateBlog -fail update non existent blog", async()=>{
        let obj = {
            username: "vrutikrabadia1",
            password: "hello",
            confirm: "hello",
        };

        const response = await (await request(app).post("/states/register").type('form').send(obj));

        let obj1 = {
            username: "vrutikrabadia1",
            password: "hello",
        };
        const response2 = await (await request(app).post("/states/login").type('form').send(obj1));
        
        let token = response2.body.accessToken;

        const response1 = await (await request(app).post("/states/updateBlog").type('form').set('Authorization', `Bearer ${token}`).send(testBlog2));
        expect(response1.res.text).toEqual("No such blog is created by you!");
    });

    it("POST /state/updateBlog -sucess", async()=>{
        let obj1 = {
            username: "vrutikrabadia",
            password: "hello",
        };
        const response2 = await (await request(app).post("/states/login").type('form').send(obj1));
        
        let token = response2.body.accessToken;

        const response1 = await (await request(app).post("/states/updateBlog").type('form').set('Authorization', `Bearer ${token}`).send(testBlog3));
        expect(response1.res.text).toEqual("blog sucessfully updated!");
    });

    it("POST /state/findWithTitle -sucess", async()=>{
        let obj1 = {
            username: "vrutikrabadia1",
            password: "hello",
        };
        const response2 = await (await request(app).post("/states/login").type('form').send(obj1));
        
        let token = response2.body.accessToken;

        const response1 = await (await request(app).post("/states/findWithTitle").type('form').set('Authorization', `Bearer ${token}`).send({title: "Blog1"}));
        
        let blog = response1.body[0];
        delete blog._id;
        delete blog.__v;
        delete blog.author;
        expect(blog).toEqual(testBlog3);
    });

    it("POST /state/findWithTitle -sucess no blog found", async()=>{
        let obj1 = {
            username: "vrutikrabadia1",
            password: "hello",
        };
        const response2 = await (await request(app).post("/states/login").type('form').send(obj1));
        
        let token = response2.body.accessToken;

        const response1 = await (await request(app).post("/states/findWithTitle").type('form').set('Authorization', `Bearer ${token}`).send({title: "Blog2"}));
        
        
        expect(response1.res.text).toEqual("No such Blog exists!");
    });

    it("POST /state/deleteBlog -fail not the author of the blog", async ()=>{
        let obj1 = {
            username: "vrutikrabadia1",
            password: "hello",
        };
        const response2 = await (await request(app).post("/states/login").type('form').send(obj1));

        let token = response2.body.accessToken;

        const response1 = await (await request(app).post("/states/deleteBlog").type('form').set('Authorization', `Bearer ${token}`).send({title: "Blog1"}));
        
        expect(response1.res.text).toEqual("No such blog is created by you!");
    });

    it("POST /state/deleteBlog -fail non existent blog", async ()=>{
        let obj1 = {
            username: "vrutikrabadia",
            password: "hello",
        };
        const response2 = await (await request(app).post("/states/login").type('form').send(obj1));

        let token = response2.body.accessToken;

        const response1 = await (await request(app).post("/states/deleteBlog").type('form').set('Authorization', `Bearer ${token}`).send({title: "Blog2"}));
        
        expect(response1.res.text).toEqual("No such blog is created by you!");
    });

    it("POST /state/deleteBlog -fail non existent blog", async ()=>{
        let obj1 = {
            username: "vrutikrabadia",
            password: "hello",
        };
        const response2 = await (await request(app).post("/states/login").type('form').send(obj1));

        let token = response2.body.accessToken;

        const response1 = await (await request(app).post("/states/deleteBlog").type('form').set('Authorization', `Bearer ${token}`).send({title: "Blog2"}));
        
        expect(response1.res.text).toEqual("No such blog is created by you!");
    });

    it("POST /state/deleteBlog -sucess", async ()=>{
        let obj1 = {
            username: "vrutikrabadia",
            password: "hello",
        };
        const response2 = await (await request(app).post("/states/login").type('form').send(obj1));

        let token = response2.body.accessToken;

        const response1 = await (await request(app).post("/states/deleteBlog").type('form').set('Authorization', `Bearer ${token}`).send({title: "Blog1"}));
        
        expect(response1.res.text).toEqual("Blog deleted sucessfully");
    });

    it("POST /state/deleteUser -fail user not logged in", async ()=>{
        const response = await (await request(app).get("/states/deleteUser"));

        expect(response.statusCode).toEqual(401);
    });

    it("POST /state/deleteUser -sucess user1", async ()=>{
        let obj1 = {
            username: "vrutikrabadia",
            password: "hello",
        };
        const response2 = await (await request(app).post("/states/login").type('form').send(obj1));

        let token = response2.body.accessToken;

        const response = await (await request(app).get("/states/deleteUser").set('Authorization', `Bearer ${token}`));

        expect(response.res.text).toEqual("User deleted sucessfully");
    });

    it("POST /state/deleteUser -sucess user2", async ()=>{
        let obj1 = {
            username: "vrutikrabadia1",
            password: "hello",
        };
        const response2 = await (await request(app).post("/states/login").type('form').send(obj1));

        let token = response2.body.accessToken;

        const response = await (await request(app).get("/states/deleteUser").set('Authorization', `Bearer ${token}`));

        expect(response.res.text).toEqual("User deleted sucessfully");
    });
});