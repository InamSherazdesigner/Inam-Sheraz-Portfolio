/**
 * THE CONSOLE.
 *
 * The first test is the most important one in the frontend suite. An earlier
 * version of this project hid the project list behind a thumbnail and failed
 * for exactly that reason, and BUILD_SPEC §2 makes "the list is readable text
 * immediately" the single most important rule in the build. This asserts it,
 * so it cannot quietly regress.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Console } from '@/components/console/Console';
import { PROJECTS } from '@/content/projects';

/** next/link renders an anchor; jsdom needs nothing else from it. */
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href as string} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: React.ComponentProps<'img'>) => <img {...props} />,
}));

/** The console boots on a timer. Every test starts from the menu. */
async function bootedConsole() {
  const user = userEvent.setup();
  render(<Console />);
  await screen.findByRole('listbox', {}, { timeout: 3000 });
  return user;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('the menu', () => {
  it('shows all eleven projects as readable text once booted', async () => {
    await bootedConsole();

    const list = screen.getByRole('listbox');
    const rows = within(list).getAllByRole('option');
    expect(rows).toHaveLength(11);

    // Not a thumbnail, not an icon — the actual titles.
    for (const project of PROJECTS) {
      expect(within(list).getByText(project.title)).toBeInTheDocument();
    }
  });

  it('shows the channel name and an item count', async () => {
    await bootedConsole();
    expect(screen.getByText('WORK')).toBeInTheDocument();
    expect(screen.getByText('11 ITEMS')).toBeInTheDocument();
  });

  it('selects the first row on load', async () => {
    await bootedConsole();
    const rows = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(rows[0]).toHaveAttribute('aria-selected', 'true');
    expect(rows[1]).toHaveAttribute('aria-selected', 'false');
  });
});

describe('the D-pad', () => {
  it('moves the selection down and up', async () => {
    const user = await bootedConsole();

    await user.click(screen.getByLabelText('Down'));
    let rows = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(rows[1]).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByLabelText('Up'));
    rows = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(rows[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('wraps at the ends so holding a direction never dead-ends', async () => {
    const user = await bootedConsole();

    await user.click(screen.getByLabelText('Up'));
    const rows = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(rows[10]).toHaveAttribute('aria-selected', 'true');
  });

  it('changes channel left and right, and clamps at the ends', async () => {
    const user = await bootedConsole();

    /**
     * Queried by the listbox's accessible name rather than by text. On the
     * About and Contact channels the header label and the single row label
     * are the same word, so getByText would match twice — and the thing worth
     * asserting is which channel the list belongs to.
     */
    const channelName = () => screen.getByRole('listbox').getAttribute('aria-label');

    expect(channelName()).toBe('WORK');

    await user.click(screen.getByLabelText('Right'));
    expect(channelName()).toBe('ABOUT');
    expect(screen.getByText('01 ITEMS')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Right'));
    expect(channelName()).toBe('CONTACT');

    // Clamped, not wrapped — the chevrons dim at the ends and wrapping
    // would make them a lie.
    await user.click(screen.getByLabelText('Right'));
    expect(channelName()).toBe('CONTACT');

    await user.click(screen.getByLabelText('Left'));
    expect(channelName()).toBe('ABOUT');
  });
});

describe('the keyboard', () => {
  it('accepts arrows, and Enter as A', async () => {
    const user = await bootedConsole();

    await user.keyboard('{ArrowDown}');
    const rows = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(rows[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('reaches the info card through the loading stage', async () => {
    const user = await bootedConsole();

    await user.keyboard('{Enter}');

    // Stage 2 first — the sprite and the Tetris bar.
    expect(screen.getByText('LOADING…')).toBeInTheDocument();

    // Then stage 3, the info card.
    await waitFor(() => expect(screen.getByText('– INFO CARD –')).toBeInTheDocument(), {
      timeout: 5000,
    });
    expect(screen.getByText('01 / 11')).toBeInTheDocument();
    expect(screen.getByText('A VIEW FULL WORK')).toBeInTheDocument();
  });

  it('opens the full view from the card and backs out again', async () => {
    const user = await bootedConsole();

    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByText('– INFO CARD –')).toBeInTheDocument(), {
      timeout: 5000,
    });

    await user.keyboard('{Enter}');
    const stage = await screen.findByRole('dialog');
    expect(within(stage).getByRole('heading', { level: 1 })).toHaveTextContent(
      'MOODIYAN TON AGGE'
    );

    // B backs out one stage at a time.
    await user.keyboard('b');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('– INFO CARD –')).toBeInTheDocument();
  });

  it('does not hijack typing inside a text field', async () => {
    const user = await bootedConsole();

    // A field outside the console stands in for the CAT password and the
    // contact form: pressing "b" there must type a "b", not go back.
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    await user.keyboard('ab');
    expect(input.value).toBe('ab');

    // The selection did not move.
    const rows = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(rows[0]).toHaveAttribute('aria-selected', 'true');

    input.remove();
  });
});

describe('START', () => {
  it('shuts the screen down and boots it again', async () => {
    const user = await bootedConsole();

    expect(document.querySelector('.console__lamp')).toHaveAttribute('data-power', 'on');
    await user.click(screen.getByLabelText('Start — turn the console on or off'));
    expect(screen.getByText('PRESS START')).toBeVisible();
    expect(document.querySelector('.console__lamp')).toHaveAttribute('data-power', 'off');

    await user.click(screen.getByLabelText('Start — turn the console on or off'));
    await screen.findByRole('listbox', {}, { timeout: 3000 });
    expect(document.querySelector('.console__lamp')).toHaveAttribute('data-power', 'on');
  });
});

describe('the escape hatch', () => {
  it('is always visible and needs no control to be learned', async () => {
    await bootedConsole();

    const hatch = screen.getByRole('link', { name: /VIEW EVERYTHING AS ONE PAGE/i });
    expect(hatch).toBeVisible();
    expect(hatch).toHaveAttribute('href', '/everything');
  });
});

describe('clicking a row', () => {
  it('opens a project without touching the D-pad', async () => {
    const user = await bootedConsole();

    const rows = within(screen.getByRole('listbox')).getAllByRole('option');
    await user.click(rows[4]!);

    await waitFor(() => expect(screen.getByText('– INFO CARD –')).toBeInTheDocument(), {
      timeout: 5000,
    });
    expect(screen.getByText('05 / 11')).toBeInTheDocument();
    expect(screen.getByText('SCENTS BY AMMAN')).toBeInTheDocument();
  });
});
