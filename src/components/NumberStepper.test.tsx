import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberStepper } from './NumberStepper';

it('accepts a multi-digit value without clamping each keystroke', async () => {
  function Harness() {
    const [value, setValue] = useState(4);
    return <NumberStepper label="Игроков" value={value} onChange={setValue} min={2} max={120} />;
  }
  const user = userEvent.setup();
  render(<Harness />);
  await user.clear(screen.getByRole('spinbutton'));
  await user.type(screen.getByRole('spinbutton'), '12');
  await user.tab();
  expect(screen.getByRole('spinbutton')).toHaveValue(12);
});
