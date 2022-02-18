let _ = require("lodash");
let MongoClient = require("mongodb").MongoClient;
let url = "mongodb://localhost:27017";
var ObjectId = require('mongodb').ObjectID;

(async () => {

    let connection = await MongoClient.connect(url, { useNewUrlParser: true });
    let db = connection.db("ml-survey-new");
    try {

        let projectDocuments = await db.collection('projects').find({entityId:{$exists:true}}).toArray();
        let chunkOfProjectDocuments = _.chunk(projectDocuments, 10);
        let entityId;
    
        
        for (let pointerToProjectDocument = 0; pointerToProjectDocument < chunkOfProjectDocuments.length; pointerToProjectDocument++) {
            
            entityId = await chunkOfProjectDocuments[pointerToProjectDocument].map(
                projectsDoc => {
                  return  projectsDoc.entityId;
                }
            );
        
            let entityDocuments = await db.collection('entities').find({
                _id: { $in : entityId },
                registryDetails:{$exists:true}
            }).project({ 
                "registryDetails.locationId":1,
                "registryDetails.code":1
            }).toArray();
            
           
            
            
            await Promise.all(
                
                entityDocuments.map(async entityData => {

                   
                    let updateObject = {
                        "$set" : {}
                    };

                    updateObject["$set"]["entityId"] = entityData.registryDetails.locationId;
                    updateObject["$set"]["entityInformation._id"] = entityData.registryDetails.locationId;
                    updateObject["$set"]["entityInformation.externalId"] = entityData.registryDetails.code;

                    let projectsEntityDetails = await db.collection('projects').updateMany({
                        "entityId": entityData._id
                    },updateObject);
                    
                })
            )
        }
        
        
        console.log("completed")

        connection.close();
    }
    catch (error) {
        console.log(error)
    }
})().catch(err => console.error(err));