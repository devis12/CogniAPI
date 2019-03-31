/*
*   Module which provides functions in order to manipulate and extract data
*   from Azure Computer Vision adult tag & Google Cloud Vision safeSearchAnnotation,
*   cross check and combine them
*
*   @author: Devis
*/

/*  Commodity function in order to translate enum gcloud likelihood values into double*/
//TODO evaluate with marcos appropriate convertion value
function toDouble(likelihood){
    if(likelihood == 'VERY_UNLIKELY')
        return 0.1;
    else if(likelihood == 'UNLIKELY')
        return 0.2;
    else if(likelihood == 'POSSIBLE')
        return 0.5;
    else if(likelihood == 'LIKELY')
        return 0.8;
    else if(likelihood == 'VERY_LIKELY')
        return 0.9;
    else//UNKNOWN or general error
        return -1;
}



/*  return boolean value for adult content by cross-checking values between the services*/
function isAdultContent(azureAdult, gcloudSafetyAnn){
    if(     !azureAdult['isAdultContent']

            &&

            (   gcloudSafetyAnn['adult'] == 'VERY_UNLIKELY' ||
                gcloudSafetyAnn['adult'] == 'UNLIKELY' ||
                gcloudSafetyAnn['adult'] == 'UNKNOWN'
            )
        )

        return false;

    return true;
}

/*  return boolean value for adult content by cross-checking values between the services*/
function isRacyContent(azureAdult, gcloudSafetyAnn){
    if(     !azureAdult['isRacyContent']

        &&

        (   gcloudSafetyAnn['racy'] == 'VERY_UNLIKELY' ||
            gcloudSafetyAnn['racy'] == 'UNLIKELY' ||
            gcloudSafetyAnn['racy'] == 'UNKNOWN'
        )
    )

        return false;

    return true;
}

/*  Build cogniAPI safety obj provided azure adult & google cloud
*   safety annotation
*   */
function buildSafetyTag(azureAdult, gcloudSafetyAnn){
    let resObj = {};

    //boolean isadultContent value
    resObj['isAdultContent'] = isAdultContent(azureAdult, gcloudSafetyAnn);
    if((resObj['isAdultContent'] || azureAdult['adultScore'] > 0.1)  && toDouble(gcloudSafetyAnn['adult']) > 0){
        //in the case of true or significant value by azure perform the average between gcloud & azure values
        resObj['adult'] = (azureAdult['adultScore'] + toDouble(gcloudSafetyAnn['adult']))/2;
    }else{
        //just take azure score, since it's really low
        resObj['adult'] = azureAdult['adultScore'];
    }

    //boolean isracyContent value
    resObj['isRacyContent'] = isRacyContent(azureAdult, gcloudSafetyAnn);
    if((resObj['isRacyContent'] || azureAdult['racyScore'] > 0.1) && toDouble(gcloudSafetyAnn['racy']) > 0){
        //in the case of true or significant value by azure perform the average between gcloud & azure values
        resObj['racy'] = (azureAdult['racyScore'] + toDouble(gcloudSafetyAnn['racy']))/2;
    }else{
        //just take azure score, since it's really low
        resObj['racy'] = azureAdult['racyScore'];
    }

    //add gcloud additional tags for safety
    if(toDouble(gcloudSafetyAnn['spoof']) > 0)
        resObj['spoof'] = toDouble(gcloudSafetyAnn['spoof']);

    if(toDouble(gcloudSafetyAnn['medical']) > 0)
        resObj['medical'] = toDouble(gcloudSafetyAnn['medical']);

    if(toDouble(gcloudSafetyAnn['violence']) > 0)
        resObj['violence'] = toDouble(gcloudSafetyAnn['violence']);

    return resObj;
}
module.exports = {buildSafetyTag};
