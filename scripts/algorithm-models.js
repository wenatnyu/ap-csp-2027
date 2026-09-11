(function(root){'use strict';
function search(values,target,mode='binary'){
  if(!values.length||values.length>20||values.some(n=>!Number.isFinite(n))||!Number.isFinite(target))throw Error('Use 1–20 finite numbers and a numeric target.');
  if(!['linear','binary'].includes(mode))throw Error('Choose linear or binary search.');
  if(mode==='binary'&&values.some((v,i)=>i&&v<values[i-1]))throw Error('Binary search requires the list to be sorted in increasing order.');
  const steps=[];let lo=0,hi=values.length-1;
  while(lo<=hi){const at=mode==='binary'?Math.floor((lo+hi)/2):lo,value=values[at],found=value===target;
    const before=[lo+1,hi+1];if(!found){if(mode==='linear'||value<target)lo=at+1;else hi=at-1;}
    steps.push({comparison:steps.length+1,index:at+1,value,found,before,after:found?[at+1,at+1]:[lo+1,hi+1],done:found||lo>hi});if(found)break;
  }return steps;
}
function growth(n,rate=1000000){if(!Number.isInteger(n)||n<1||n>60||!Number.isFinite(rate)||rate<=0)throw Error('Use a whole input size from 1 to 60.');return [{name:'n',steps:n},{name:'n²',steps:n*n},{name:'2ⁿ',steps:2**n}].map(x=>({...x,seconds:x.steps/rate}));}
const api={search,growth};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CSPAlgorithmModels=api;
})(typeof window!=='undefined'?window:this);
