const path = require('path');

//functions to compare table/game names. Not really fuzzy, more simplifed. 

const getFirstNWords=function(str)//not used. left for reference/debugging
{
    var firstPart = str.split(".")[0].split("(")[0];
    firstPart = firstPart.toLowerCase().replace(/\-/g, " ").replace(/_/g, " ").replace(/\'/g, "").replace(/\"/g, "").replace(/\&/g, " and ").replace(/\'/g, "")
        .replace(/\,/g, " ").replace(/\./g, " ").replace(/\!/g, " ")
        .replace(/  /g, " ");//double spaces
        //.replace(/the/g, "").replace(/and/g, "")
    var words=firstPart.split(" ").filter(a=>a!=="");
    return words;

}

const fuzzyCompare=function (a, b) {
    //console.log([a, b]);
    
    var ca = a.toLowerCase().replace(/ /g, "").replace(/-/g, "").replace(/\(/g, "").replace(/\)/g, "");
    var cb = b.toLowerCase().replace(/ /g, "").replace(/-/g, "").replace(/\(/g, "").replace(/\)/g, "");

    //if (ca.startsWith("char") && cb.startsWith("char"))
    //    console.log([ca, cb]);
    //if (ca.Contains("pharaoh") && cb.Contains("pharaoh"))
    //    Console.WriteLine("here");

    if (ca == cb)
        return true;
    return false;
}
const simplifyName=function (tableName,replaceWith=" ") {
    if (tableName.indexOf(')') > 0)
        tableName = tableName.substring(0, tableName.indexOf('('));
    var ca = tableName.toLowerCase().replace(/ /g, replaceWith).replace(/\-/g, replaceWith).replace(/_/g, replaceWith).
        replace(/\'/g, replaceWith).replace(/\"/g, replaceWith).replace(/\&/g, replaceWith).replace(/\#/g, replaceWith).replace(/\;/g, replaceWith).
        replace(/\(/g, replaceWith).replace(/\)/g, replaceWith).replace(/\,/g, replaceWith).replace(/\./g, replaceWith).
        replace(/\!/g, replaceWith).replace(/the /g, replaceWith).replace(/ and /g, replaceWith).replace(/do brasil/g, replaceWith).
        //replace(/^[0-9]+/g, replaceWith).//NOTE replace leading numbers. useful for folders from zip files.. 
        //replace(/[0-9]/g, replaceWith).//NOTE replace ALL numbers. 
        replace(/  /g, replaceWith);//double spaces
    return ca;
}
const superFuzzyCompare=function (a, b) {
    var ca = simplifyName(a).replace(/ /g, "");
    var cb = simplifyName(b).replace(/ /g, "");

    //if (ca.startsWith("idr") && cb.startsWith("idr"))
    //    console.log([ca, cb]);
    //Console.WriteLine(ca);

    if (ca == cb)
        return true;
    return false;
}

const tableGetBestName = function(tablePath)
{
    //first use filename
    var tname = path.basename(tablePath);
    //remove as much junk as possible
    let bestName = tname.replace(".vpx","").replace(/\[(.+?)\]/g, "").replace(/\-/g, " ")
        .replace(/_/g, " ").replace(/\,/g, " ").replace(/\./g, " ");
    let tableFolder= path.basename(path.dirname(tablePath))
    //See if table folder might be better for guessing name.
    if(bestName.indexOf("(")<0 && tableFolder.indexOf("(")>0)
    {
        bestName=tableFolder.replace(/\[(.+?)\]/g, "").replace(/\-/g, " ")
            .replace(/_/g, " ").replace(/\,/g, " ").replace(/\./g, " ");
    }
    return bestName
}

module.exports ={
    fuzzyCompare,simplifyName,superFuzzyCompare,tableGetBestName
}