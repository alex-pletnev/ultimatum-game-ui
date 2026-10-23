import { render, screen } from '@testing-library/react';
import { InkField } from './InkField';
it('keeps the input name separate from its description', () => {
  render(<InkField label="Имя" hint="От 3 до 42 символов" />);
  expect(screen.getByRole('textbox', { name: 'Имя' })).toHaveAccessibleDescription(
    'От 3 до 42 символов',
  );
});
