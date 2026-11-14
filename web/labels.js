// The raw editorial labels remain in the data; display labels clarify their scope.
export const coverageLabel=value=>value==='Confirmed result'?'Background result recorded':value||'Not stated';
export const claimLabel=value=>value==='Speculative'?'Interpretation':value||'Not stated';
