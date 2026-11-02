import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from './utils';

/** The comment items of the thread, top level only. */
const roots = () =>
  Array.from(document.querySelectorAll<HTMLElement>('ul.thread > li.comment')).filter(
    (li) => !li.parentElement?.closest('li.comment'),
  );
const replyBtn = (li: HTMLElement) => within(li).getAllByRole('button', { name: /^Reply/ })[0];

describe('replies open under the comment they answer', () => {
  it('opens the composer between comment 1 and comment 2, posts under comment 1, and cancels cleanly', async () => {
    renderApp('/community/proposals/idea-1');
    await screen.findByText(/save our teams a lot of repeat work/);
    const [one, two] = roots();
    expect(roots()).toHaveLength(2);

    const btn = replyBtn(one);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    // The composer is inside comment 1's own thread, before comment 2.
    const composer = one.querySelector('.reply-composer') as HTMLElement;
    expect(composer).toBeTruthy();
    expect(two.querySelector('.reply-composer')).toBeNull();
    expect(one.compareDocumentPosition(two) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(composer).getByText(/Replying to /)).toBeInTheDocument();
    const box = within(composer).getByRole('textbox');
    expect(box).toHaveFocus();
    const post = within(composer).getByRole('button', { name: 'Post reply' });
    expect(post).toBeDisabled();
    expect(document.querySelectorAll('.reply-composer')).toHaveLength(1);

    // Only one composer at a time: opening another closes the first.
    await userEvent.click(replyBtn(two));
    expect(document.querySelectorAll('.reply-composer')).toHaveLength(1);
    expect(one.querySelector('.reply-composer')).toBeNull();
    expect(two.querySelector('.reply-composer')).toBeTruthy();

    // The typed draft is kept for comment 1 until it is posted or cancelled.
    await userEvent.click(replyBtn(one));
    await userEvent.type(within(one).getByRole('textbox'), 'Draft kept');
    await userEvent.click(replyBtn(two));
    await userEvent.click(replyBtn(one));
    expect(within(one).getByRole('textbox')).toHaveValue('Draft kept');

    // Post: the reply sits at the end of comment 1's replies, the composer closes, focus returns.
    await userEvent.click(within(one).getByRole('button', { name: 'Post reply' }));
    await waitFor(() => expect(one.querySelector('.reply-composer')).toBeNull(), { timeout: 4000 });
    await waitFor(() => expect(within(one).getByText('Draft kept')).toBeInTheDocument(), {
      timeout: 4000,
    });
    expect(one.querySelector('ul.thread')!.textContent).toContain('Draft kept');
    expect(two.textContent).not.toContain('Draft kept');
    expect(await screen.findByText('Reply posted')).toBeInTheDocument();
    await waitFor(() => expect(replyBtn(roots()[0])).toHaveFocus());

    // Cancel restores the thread and drops the draft.
    await userEvent.click(replyBtn(roots()[1]));
    await userEvent.type(within(roots()[1]).getByRole('textbox'), 'Never sent');
    await userEvent.click(within(roots()[1]).getByRole('button', { name: 'Cancel' }));
    expect(document.querySelectorAll('.reply-composer')).toHaveLength(0);
    expect(replyBtn(roots()[1])).toHaveFocus();
    await userEvent.click(replyBtn(roots()[1]));
    expect(within(roots()[1]).getByRole('textbox')).toHaveValue('');
  });

  it('closes on Escape, posts with Ctrl+Enter, and never shows two composers', async () => {
    renderApp('/community/proposals/idea-1');
    await screen.findByText(/save our teams a lot of repeat work/);
    const one = roots()[0];
    await userEvent.click(replyBtn(one));
    await userEvent.keyboard('{Escape}');
    expect(document.querySelectorAll('.reply-composer')).toHaveLength(0);
    expect(replyBtn(one)).toHaveFocus();
    await userEvent.click(replyBtn(one));
    await userEvent.type(within(one).getByRole('textbox'), 'Sent by keyboard');
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    await waitFor(() => expect(one.textContent).toContain('Sent by keyboard'), { timeout: 4000 });
  });

  it('shows two replies, expands the rest inline, and starts a reply to a reply with a mention', async () => {
    renderApp('/community/discourse/post-1');
    await screen.findByText(/Rotate shifts weekly/);
    const one = roots()[0];
    const inner = () => Array.from(one.querySelectorAll('ul.thread > li.comment'));
    expect(inner()).toHaveLength(2);
    await userEvent.click(within(one).getByRole('button', { name: 'View 1 more reply' }));
    expect(inner()).toHaveLength(3);
    // Reply to a reply: the composer opens under that reply and starts with an @mention.
    const target = inner()[0] as HTMLElement;
    await userEvent.click(replyBtn(target));
    expect(target.querySelector('.reply-composer')).toBeTruthy();
    expect((within(target).getByRole('textbox') as HTMLTextAreaElement).value).toMatch(/^@\S+/);
    // The bottom box is for new top-level comments only.
    expect(screen.getByLabelText('Add a comment')).toBeInTheDocument();
    await act(async () => {});
  });
});
