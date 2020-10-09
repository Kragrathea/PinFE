//functions to compare table/game names. Not really fuzzy, more simplifed. 

const fuzzyCompare=function (a, b) {
    //console.log([a, b]);

    //if (a.startsWith("Char") && b.startsWith("Char"))
    //    console.log([a, b]);
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
const simplifyNameOld=function (tableName) {
    if (tableName.indexOf(')') > 0)
        tableName = tableName.substring(0, tableName.indexOf('('));
    var ca = tableName.toLowerCase().replace(/ /g, "").replace(/\-/g, "").replace(/_/g, "").replace(/\'/g, "").replace(/\"/g, "").replace(/\&/g, "").replace(/\'/g, "").replace(/\(/g, "").replace(/\)/g, "").
        replace(/\,/g, "").replace(/\./g, "").replace(/\!/g, "").replace(/the/g, "").replace(/and/g, "").replace(/do brasil/g, "").replace(/ /g, "");
    return ca;
}
const simplifyName=function (tableName,replaceWith=" ") {
    if (tableName.indexOf(')') > 0)
        tableName = tableName.substring(0, tableName.indexOf('('));
    var ca = tableName.toLowerCase().replace(/ /g, replaceWith).replace(/\-/g, replaceWith).replace(/_/g, replaceWith).
        replace(/\'/g, replaceWith).replace(/\"/g, replaceWith).replace(/\&/g, replaceWith).replace(/\#/g, replaceWith).replace(/\;/g, replaceWith)
        .replace(/\'/g, replaceWith).
        replace(/\(/g, replaceWith).replace(/\)/g, replaceWith).replace(/\,/g, replaceWith).replace(/\./g, replaceWith).
        replace(/\!/g, replaceWith)./*replace(/the/g, replaceWith).replace(/and/g, replaceWith).*/replace(/do brasil/g, replaceWith).
        replace(/^[0-9]+/g, replaceWith).//NOTE replace leading numbers. 
        //replace(/[0-9]/g, replaceWith).//NOTE replace ALL numbers. 
        // replace(/jp s/g, replaceWith).
        // replace(/jps/g, replaceWith).
        // replace(/jp/g, replaceWith).
        replace(/  /g, replaceWith);//double spaces
    return ca;
}
const superFuzzyCompare=function (a, b) {
    var ca = simplifyName(a);
    var cb = simplifyName(b);

    if (ca.startsWith("shadow") && cb.startsWith("shadow"))
        console.log([ca, cb]);
    //Console.WriteLine(ca);

    if (ca == cb)
        return true;
    return false;
}

module.exports ={
    fuzzyCompare,simplifyName,superFuzzyCompare
}