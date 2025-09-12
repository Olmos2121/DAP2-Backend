exports.up = (pgm) => {
  pgm.addColumn('reviews', {
    moderated_at: { type: 'timestamptz' },
    moderation_label: { type: 'text' },     
    moderation_score: { type: 'numeric(3,2)' }, 
    moderation_reason: { type: 'text' },     
    moderation_source: { type: 'text', default: 'ai' },
  });
};
exports.down = (pgm) => {
  pgm.dropColumns('reviews', [
    'moderated_at','moderation_label','moderation_score','moderation_reason','moderation_source'
  ]);
};