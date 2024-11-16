const express=require("express");
const app=express();
app.use(express.json());
const path=require("path");
const dbpath=path.join(__dirname,"covid19IndiaPortal.db");
const sqlite3=require("sqlite3");
const {open}=require("sqlite");
const bcrypt=require("bcrypt");
const jwt =require("jsonwebtoken");

let db=null;

const dbinitilizer=async ()=>{
     try{
         db=await open({
             filename:dbpath,
             driver:sqlite3.Database,
         });
         app.listen(3000,()=>{
             console.log(`server is running at http://localhost:3000` );
         })
     }
     catch(e){
console.log(`database error is ${e.message}`);
     }
}
dbinitilizer();

const jwtverifyication=(request,response,next)=>{
let jwtToken;
const authheader=request.headers["authorization"];
if (authheader!==undefined){
    jwtToken=authheader.split(" ")[1];
}
if (jwtToken===undefined){
      response.status(401);
      response.send("Invalid JWT Token");

}
else{
  jwt.verify(jwtToken,"MY_SECRET_TOKEN",(error,payload)=>{
      if(error){
            response.status(401);
           response.send("Invalid JWT Token");
      }
      else{
          request.username=payload.username;
          next();
      }
  })  
}
    
 }
//api1
app.post("/login/",async(request,response)=>{
     const {username,password}=request.body;
     const query=`select * from user where username='${username}'`;
     const dbuser=await db.get(query);
     if (dbuser!==undefined){
        const comparepassword=await bcrypt.compare(password,dbuser.password);
        if (comparepassword){
            const payload={username:username};
             const jwtToken=jwt.sign(payload,"MY_SECRET_TOKEN");
             
             response.send({jwtToken});
        }
        else{
            response.status(400);
            response.send("Invalid password");
        }
     }
     else{
         response.status(400);
         response.send("Invalid user");
     }
});
//api2
app.get("/states/",jwtverifyication,async(request,response)=>{
   const {username}=request;
   const query1=`select * from state`;
   const result=await db.all(query1);
   const result1=result.map((e)=>{return{
  stateId: e.state_id,
 stateName: e.state_name,
    population:e.population}
   })
   response.send(result1);
});
//api3
app.get("/states/:stateId/",jwtverifyication,async(request,response)=>{
    const{stateId}=request.params;
    const query=`select * from state where state_id=${stateId}`;
    const result=await db.get(query);
    const result1={
     "stateId": result.state_id,
  "stateName": result.state_name,
  "population": result.population
}
    response.send(result1);
})
//api4
app.post("/districts/",jwtverifyication,async(request,response)=>{
    const{ districtName,stateId,cases,cured,active,deaths   }=request.body;
 const query=`insert into district( district_name,state_id,cases,cured,active,deaths) values ('${districtName}','${stateId}','${cases }','${cured}','${active}','${deaths}')`;
 const result=await db.run(query);
 response.send(`District Successfully Added`);
})
//api5
app.get("/districts/:districtId/",jwtverifyication,async(request,response)=>{
    const{districtId}=request.params;
    const query=`select * from district where district_id=${districtId}`;
    const result=await db.get(query);
    const result1={
        
  "districtId":result.district_id,
  "districtName": result.district_name,
  "stateId": result.state_id,
  "cases": result.cases,
  "cured": result.cured,
  "active": result.active,
  "deaths": result.deaths
}
    response.send(result1);
})
//api6
app.delete("/districts/:districtId/",jwtverifyication,async(request,response)=>{
    const{districtId}=request.params;
    const query=`delete from district where district_id=${districtId}`;
    const result=await db.run(query);
    response.send("District Removed");
})

//api7
app.put("/districts/:districtId/",jwtverifyication,async(request,response)=>{
    const{ districtName,stateId,cases,cured,active,deaths  }=request.body;
    const{districtId}=request.params;
    const query=`update district set district_name='${districtName}',state_id='${stateId}',cases='${cases}',cured='${cured}',active='${active}',deaths='${deaths}' where district_id=${districtId}`;
   const result=await db.run(query);
   response.send("District Details Updated");
})


//api8
app.get("/states/:stateId/stats/",jwtverifyication,async(request,response)=>{
     const { stateId } = request.params;
    const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;


    const stats = await db.get(getStateStatsQuery);
    response.send({
      totalCases: stats["SUM(cases)"],
      totalCured: stats["SUM(cured)"],
      totalActive: stats["SUM(active)"],
      totalDeaths: stats["SUM(deaths)"],
    });
  }
);


    //state.state_id, 









module.exports=app;