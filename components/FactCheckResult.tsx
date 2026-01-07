import React from 'react';
import { FactCheckResponse, Verdict } from '../types';
import { VERDICT_COLORS, VERDICT_TEXT_COLORS } from '../constants';

interface FactCheckResultProps {
  result: FactCheckResponse;
}

const FactCheckResult: React.FC<FactCheckResultProps> = ({ result }) => {
  const { verdict, confidenceScore, coreFinding, evidence, sources } = result;

  const verdictColorClass = VERDICT_COLORS[verdict] || VERDICT_COLORS[Verdict.UNVERIFIED];
  const verdictTextColorClass = VERDICT_TEXT_COLORS[verdict] || VERDICT_TEXT_COLORS[Verdict.UNVERIFIED];

  return (
    <div className={`p-4 rounded-lg shadow-md border ${verdictColorClass}`}>
      <h3 className={`text-lg font-bold mb-2 ${verdictTextColorClass}`}>
        Verdict: {verdict} <span className="text-gray-600 ml-2">({confidenceScore}%)</span>
      </h3>
      <p className="mb-3 text-gray-800">
        <span className="font-semibold">Core Finding:</span> {coreFinding}
      </p>

      <div className="mb-3">
        <h4 className="font-semibold text-gray-700">Evidence:</h4>
        <ul className="list-disc list-inside text-sm text-gray-700 pl-4">
          {evidence.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700">Sources:</h4>
        <ul className="list-disc list-inside text-sm text-gray-700 pl-4">
          {sources.length > 0 ? (
            sources.map((source, index) => (
              <li key={index}>{source}</li>
            ))
          ) : (
            <li>No specific sources cited.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FactCheckResult;