let _ = require("lodash");
let MongoClient = require("mongodb").MongoClient;
let url = "mongodb://localhost:27017";
var ObjectId = require('mongodb').ObjectID;

(async () => {

    let connection = await MongoClient.connect(url, { useNewUrlParser: true });
    let db = connection.db("ml-survey-new");
    try {

        let observationSubmissionsDocument = await db.collection('observationSubmissions').find({entityId:{$exists:true}}).toArray();
        let chunkOfObservationSubmissionsDocument = _.chunk(observationSubmissionsDocument, 10);
        let entityId;
        

        for (let pointerToObservationSubmissions = 0; pointerToObservationSubmissions < chunkOfObservationSubmissionsDocument.length; pointerToObservationSubmissions++) {
            
            entityId = await chunkOfObservationSubmissionsDocument[pointerToObservationSubmissions].map(
                observationsSubmissionsDoc => {
                  return  observationsSubmissionsDoc.entityId;
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
                    updateObject["$set"]["entityExternalId"] = entityData.registryDetails.code;
                    updateObject["$set"]["entityInformation.externalId"] = entityData.registryDetails.code;

                    let updateObservationSubmissions = await db.collection('observationSubmissions').updateMany({
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