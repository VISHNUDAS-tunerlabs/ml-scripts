let _ = require("lodash");
let MongoClient = require("mongodb").MongoClient;
let url = "mongodb://localhost:27017";
var ObjectId = require('mongodb').ObjectID;

(async () => {

    let connection = await MongoClient.connect(url, { useNewUrlParser: true });
    let db = connection.db("ml-survey");
    try {

        let observationsDocument = await db.collection('observations').find({entities:{$exists:true, $ne: []}}).toArray();
        let chunkOfObservationsDocument = _.chunk(observationsDocument, 10);
        
        
        for (let pointerToObservations = 0; pointerToObservations < chunkOfObservationsDocument.length; pointerToObservations++) {
            
            let dataArray = [];
            
            await chunkOfObservationsDocument[pointerToObservations].map(
                observationsDoc => {
                    let data = {};
                    data.observationId = observationsDoc._id;
                    data.entity = observationsDoc.entities
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

                    updateObject["$set"]["entities"] = entityData.entity;
                    let observationsEntityDetails = await db.collection('observations').findOneAndUpdate({
                        "_id": entityData.observationId
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