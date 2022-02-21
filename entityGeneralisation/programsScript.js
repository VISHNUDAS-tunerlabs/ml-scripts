let _ = require("lodash");
let MongoClient = require("mongodb").MongoClient;
let url = "mongodb://localhost:27017";
var ObjectId = require('mongodb').ObjectID;

(async () => {

    let connection = await MongoClient.connect(url, { useNewUrlParser: true });
    let db = connection.db("ml-survey");
    try {

        let programsDocument = await db.collection('programs').find({'scope.entities':{$exists:true, $ne : []}}).toArray();
        let chunkOfprogramsDocument = _.chunk(programsDocument, 10);
        
        
        for (let pointerToProgramss = 0; pointerToProgramss < chunkOfprogramsDocument.length; pointerToProgramss++) {
            
            let dataArray = [];
            
            await chunkOfprogramsDocument[pointerToProgramss].map(
                programsDoc => {
                    let data = {};
                    data.programsId = programsDoc._id;
                    data.entity = programsDoc.scope.entities
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
                    let programsEntitiesUpdate = await db.collection('programs').findOneAndUpdate({
                        "_id": entityData.programsId
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