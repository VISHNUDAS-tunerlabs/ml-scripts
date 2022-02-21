let _ = require("lodash");
let MongoClient = require("mongodb").MongoClient;
let url = "mongodb://localhost:27017";
var ObjectId = require('mongodb').ObjectID;

(async () => {

    let connection = await MongoClient.connect(url, { useNewUrlParser: true });
    let db = connection.db("ml-survey");
    try {

        let solutionsDocument = await db.collection('solutions').find({'scope.entities':{$exists:true, $ne : []}}).toArray();
        let chunkOfSolutionsDocument = _.chunk(solutionsDocument, 10);
        
        
        for (let pointerToSolutions = 0; pointerToSolutions < chunkOfSolutionsDocument.length; pointerToSolutions++) {
            
            let dataArray = [];
            
            await chunkOfSolutionsDocument[pointerToSolutions].map(
                solutionsDoc => {
                    let data = {};
                    data.solutionsId = solutionsDoc._id;
                    data.entity = solutionsDoc.scope.entities
                    dataArray.push(data)
                }
            );
           
            
        
            for( entityIdpointer = 0; entityIdpointer < dataArray.length; entityIdpointer++){
                    
                    for( entityIndex = 0; entityIndex < dataArray[entityIdpointer].entity.length; entityIndex++){

                        try{
                            let entityDocuments = await db.collection('entities').find({
                                _id : dataArray[entityIdpointer].entity[entityIndex],
                                registryDetails:{$exists:true}
                                }).project({ 
                                    "registryDetails.locationId":1,
                                }).toArray();
                            if(entitiesDocument.length < 1){
                                dataArray[entityIdpointer].entity[entityIndex] = [];
                            }
                            dataArray[entityIdpointer].entity[entityIndex] = entityDocuments[0].registryDetails.locationId
                                
                            
                        }catch( err ){
                            console.log(err)
                        }    
                    }        
            }
            
            await Promise.all(
                
                dataArray.map(async entityData => {

                   
                    let updateObject = {
                        "$set" : {}
                    };

                    updateObject["$set"]["scope.entities"] = entityData.entity;
                    
                    let solutionsEntitiesUpdate = await db.collection('solutions').findOneAndUpdate({
                        "_id": entityData.solutionsId
                    },updateObject);
                    
                })
            )
        }
        
        let solutionDocument = await db.collection('solutions').find({entities:{$exists:true, $ne: []}}).toArray();
        let chunkOfSolutionDocument = _.chunk(solutionDocument, 10);
        
        
        for (let pointerToSolution = 0; pointerToSolution < 3; pointerToSolution++) {
            
            let solutionArray = [];
            await chunkOfSolutionDocument[pointerToSolution].map(
                solutionDoc => {
                    let data = {};
                    data.solutionId = solutionDoc._id;
                    data.entities = solutionDoc.entities
                    solutionArray.push(data)
                    
                }
            );
           
            
           
            for( entitiesIdpointer = 0; entitiesIdpointer < solutionArray.length; entitiesIdpointer++){
                    
                    for( entitiesIndex = 0; entitiesIndex < solutionArray[entitiesIdpointer].entities.length; entitiesIndex++ ){
                        
                        try{
                            let entitiesDocument = await db.collection('entities').find({
                                _id : solutionArray[entitiesIdpointer].entities[entitiesIndex],
                                registryDetails:{$exists:true}
                            }).project({ 
                                "registryDetails.locationId":1,
                            }).toArray();
                            console.log("entitiesDocuments:",entitiesDocument)
                            if(entitiesDocument.length < 1){
                                solutionArray[entitiesIdpointer].entities[entitiesIndex] = [];
                            }
                            solutionArray[entitiesIdpointer].entities[entitiesIndex] = entitiesDocument[0].registryDetails.locationId
                                
                            
                        }catch( err ){
                            console.log(err)
                        }    
                    }        
            }
            
            await Promise.all(
                
                solutionArray.map(async entityData => {

                   
                    let updateObject = {
                        "$set" : {}
                    };

                    updateObject["$set"]["entities"] = entityData.entities;
                    
                    let solutionEntitiesDetails = await db.collection('solutions').findOneAndUpdate({
                        "_id": entityData.solutionId
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