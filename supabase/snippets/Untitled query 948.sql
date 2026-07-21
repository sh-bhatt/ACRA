select public.upsert_complexity_metrics_for_file(
  target_review_id :=
    '5db66e08-a19e-4d55-9110-0976cffae074',

  target_file_id :=
    '7cd9ada0-65d2-4150-b3da-c180543feb06',

  target_user_id :=
    '4f5e9290-b09a-4dc9-83e4-bdf97d81378c',

  target_metrics :=
    jsonb_build_object(
      'linesOfCode', 15,
      'blankLines', 4,
      'commentLines', 0,
      'functionCount', 1,
      'classCount', 0,
      'importCount', 0,
      'cyclomaticComplexity', 2,
      'maximumNestingDepth', 1,
      'averageFunctionLength', 17,
      'maximumFunctionLength', 17,
      'maintainabilityScore', 98
    )
);