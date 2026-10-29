// Developer-only gallery (/dev/components, needs ?demo=1). Sample text here is not product copy.
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/StatusChip';
import { Tag } from '@/components/Tag';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { ListRow } from '@/components/ListRow';
import { QuickActionTile } from '@/components/QuickActionTile';
import { Banner } from '@/components/Banner';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { Skeleton, type SkeletonVariant } from '@/components/Skeleton';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { SearchField } from '@/components/SearchField';
import { FilterBar } from '@/components/FilterBar';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { Timeline } from '@/components/Timeline';
import { FormStepper } from '@/components/FormStepper';
import { BalanceMeter } from '@/components/BalanceMeter';
import { KeyValueList } from '@/components/KeyValueList';
import { FileViewer } from '@/components/FileViewer';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ToggleButton } from '@/components/ToggleButton';
import { Accordion } from '@/components/Accordion';
import { PollBar } from '@/components/PollBar';
import { LoadMore, Pagination } from '@/components/Pagination';
import { NotificationItem } from '@/components/NotificationItem';
import { HelpTip } from '@/components/HelpTip';
import { useToast } from '@/components/Toast';
import {
  Checkbox,
  DatePicker,
  DateRangePicker,
  RadioGroup,
  Select,
  TextArea,
  TextField,
} from '@/components/form/inputs';
import { FileUpload, type UploadedFile } from '@/components/form/FileUpload';
import { SimpleRichText } from '@/components/form/SimpleRichText';
import { REQUEST_STATUSES } from '@/domain/status';

const rows = [
  { id: '1', type: 'Casual leave', from: '12 Nov 2026', to: '14 Nov 2026', days: 3 },
  { id: '2', type: 'Earned leave', from: '02 Dec 2026', to: '06 Dec 2026', days: 5 },
];
const S = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section aria-labelledby={`g-${title}`}>
    <h2 id={`g-${title}`}>{title}</h2>
    {children}
  </section>
);

export default function ComponentGallery() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [text, setText] = useState('');
  const [sel, setSel] = useState('');
  const [d, setD] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [chk, setChk] = useState(false);
  const [radio, setRadio] = useState('a');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [rich, setRich] = useState('');
  const [viewer, setViewer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [filter, setFilter] = useState(['Type: Leave']);
  const [page, setPage] = useState(1);
  const [voted, setVoted] = useState(false);
  const tabs = [
    { id: 'a', label: 'Balance' },
    { id: 'b', label: 'History', count: 3 },
  ];
  const [tab] = useUrlTab(tabs);
  return (
    <div className="gallery">
      <PageHeader
        headline="Component gallery"
        tagline="Every shared component in its states."
        main={
          <button
            className="ux4g-btn-primary ux4g-btn-m"
            onClick={() => toast('Your request has been sent.')}
          >
            Show toast
          </button>
        }
        breadcrumb={[{ label: 'Dev', to: '/home' }, { label: 'Components' }]}
      />
      <S title="StatusChip">
        <div className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center ux4g-gap-s">
          {[...REQUEST_STATUSES, 'idea:accepted', 'award:open', 'officer:serving'].map((s) => (
            <StatusChip key={s} status={s} />
          ))}
        </div>
      </S>
      <S title="Tag, Avatar">
        <div className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center ux4g-gap-s">
          <Tag>Flagship initiative</Tag>
          <Avatar name="Meenakshi Sundaram" />
          <Avatar name="Asha Rao" photoUrl="/missing.png" />
        </div>
      </S>
      <S title="Card, ListRow, QuickActionTile">
        <div className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center ux4g-gap-s">
          <Card>Plain card</Card>
          <Card to="/home">Interactive card</Card>
        </div>
        <ListRow
          to="/requests"
          title="Leave, 12 to 14 November"
          meta="Sent 10 Nov 2026"
          chip={<StatusChip status="returned" />}
        />
        <div className="tiles">
          <QuickActionTile to="/requests/new/leave" icon="calendar" label="Apply for leave" />
          <QuickActionTile to="/file" icon="file" label="Open my service file" />
        </div>
      </S>
      <S title="Banner">
        <Banner variant="info">Info notice.</Banner>
        <Banner variant="warning">The desk returned this request. Reason: dates unclear.</Banner>
        <Banner variant="critical">This request was not approved.</Banner>
      </S>
      <S title="UrlTabs">
        <UrlTabs tabs={tabs} />
        <div id="tabpanel" role="tabpanel">
          Active tab: {tab}
        </div>
      </S>
      <S title="SearchField, FilterBar">
        <SearchField label="Search" value={q} onChange={setQ} count={q ? 2 : undefined} />
        <FilterBar
          active={filter.map((f) => ({ key: f, label: f }))}
          onRemove={(k) => setFilter(filter.filter((f) => f !== k))}
          onClear={() => setFilter([])}
        >
          <Select
            name="g-type"
            label="Type"
            value={sel}
            onChange={setSel}
            options={[{ value: 'l', label: 'Leave' }]}
          />
        </FilterBar>
      </S>
      <S title="ResponsiveTable">
        <ResponsiveTable
          caption="Leave history"
          rows={rows}
          rowKey={(r) => r.id}
          columns={[
            { key: 'type', header: 'Leave type', sortValue: (r) => r.type },
            { key: 'from', header: 'From' },
            { key: 'to', header: 'To' },
            { key: 'days', header: 'Days', sortValue: (r) => r.days },
          ]}
        />
      </S>
      <S title="Timeline">
        <Timeline
          steps={[
            { id: '1', title: 'Sent', date: '10 Nov 2026', role: 'You' },
            {
              id: '2',
              title: 'With desk',
              date: '11 Nov 2026',
              role: 'Desk Assistant',
              current: true,
              note: 'Checking dates.',
            },
          ]}
        />
      </S>
      <S title="FormStepper">
        <FormStepper
          onSend={() => toast('Your request has been sent.')}
          onSaveDraft={() => toast('Draft saved.')}
          steps={[
            {
              id: 'a',
              title: 'About you',
              content: (
                <TextField
                  name="g-name"
                  label="Name"
                  value="Meenakshi Sundaram"
                  onChange={() => {}}
                  locked
                />
              ),
            },
            {
              id: 'b',
              title: 'Details',
              validate: () => (text ? [] : ['Remarks: This field is required.']),
              content: (
                <TextField name="g-rem" label="Remarks" required value={text} onChange={setText} />
              ),
            },
            { id: 'c', title: 'Review and send', content: <p>Review summary</p> },
          ]}
        />
      </S>
      <S title="Form fields">
        <TextField
          name="g-t"
          label="Text"
          help="Help text"
          required
          value={text}
          onChange={setText}
          error={text ? undefined : 'This field is required.'}
        />
        <TextArea name="g-ta" label="Text area" value={text} onChange={setText} />
        <Select
          name="g-s"
          label="Select"
          value={sel}
          onChange={setSel}
          options={[{ value: 'l', label: 'Casual leave' }]}
        />
        <Select
          name="g-ss"
          label="Searchable"
          searchable
          value={sel}
          onChange={setSel}
          options={[
            { value: 'l', label: 'Casual leave' },
            { value: 'e', label: 'Earned leave' },
          ]}
        />
        <DatePicker name="g-d" label="Date" value={d} onChange={setD} />
        <DateRangePicker
          name="g-r"
          label="From and to"
          required
          from={range.from}
          to={range.to}
          onChange={setRange}
        />
        <Checkbox name="g-c" label="Checkbox" checked={chk} onChange={setChk} />
        <RadioGroup
          name="g-rg"
          legend="Radio group"
          value={radio}
          onChange={setRadio}
          options={[
            { value: 'a', label: 'One' },
            { value: 'b', label: 'Two' },
          ]}
        />
        <FileUpload name="g-f" label="Upload" files={files} onChange={setFiles} />
        <SimpleRichText name="g-rt" label="Rich text" value={rich} onChange={setRich} />
      </S>
      <S title="BalanceMeter, KeyValueList, HelpTip">
        <div className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center ux4g-gap-s">
          <BalanceMeter label="Casual leave (CL)" allowed={12} used={4} />
          <HelpTip text="Casual leave." />
        </div>
        <KeyValueList
          items={[
            { label: 'Name', value: 'Meenakshi Sundaram', meta: 'verified' },
            { label: 'Mobile', value: '+91 90000 00000', meta: 'self-reported' },
          ]}
        />
      </S>
      <S title="FileViewer, ConfirmDialog, Toast">
        <div className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center ux4g-gap-s">
          <button className="ux4g-btn-outline-primary ux4g-btn-m" onClick={() => setViewer(true)}>
            Open viewer
          </button>
          <button className="ux4g-btn-outline-primary ux4g-btn-m" onClick={() => setConfirm(true)}>
            Withdraw
          </button>
        </div>
        {viewer && <FileViewer title="G.O. (Ms) No. 123" onClose={() => setViewer(false)} />}
        {confirm && (
          <ConfirmDialog
            title="Withdraw this request?"
            body="The desk will stop working on it. You can start a new request any time."
            confirmLabel="Withdraw"
            cancelLabel="Keep request"
            onConfirm={() => setConfirm(false)}
            onCancel={() => setConfirm(false)}
          />
        )}
      </S>
      <S title="EmptyState, ErrorState">
        <EmptyState
          message="No requests yet. Start one when you need to ask for something."
          actionLabel="Start a request"
          to="/requests/new"
        />
        <ErrorState onRetry={() => toast('Retrying')} />
      </S>
      <S title="Skeleton">
        {(['text', 'row', 'card', 'tile', 'table'] as SkeletonVariant[]).map((v) => (
          <Skeleton key={v} variant={v} count={2} />
        ))}
      </S>
      <S title="ToggleButton, Accordion, PollBar">
        <div className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center ux4g-gap-s">
          <ToggleButton
            label="Back this idea"
            onLabel="Backed"
            pressed={false}
            count={12}
            onChange={() => {}}
          />
          <ToggleButton
            label="Save contact"
            onLabel="Saved"
            icon="bookmark"
            pressed
            onChange={() => {}}
          />
        </div>
        <Accordion
          items={[
            { id: '1', title: 'Who can claim LTC?', content: 'Answer one.' },
            { id: '2', title: 'How long does a claim take?', content: 'Answer two.' },
          ]}
        />
        <PollBar label="Option A" votes={6} total={10} showResult={voted} />
        <PollBar label="Option B" votes={4} total={10} showResult={voted} />
        <button className="ux4g-btn-outline-primary ux4g-btn-m" onClick={() => setVoted(true)}>
          Vote
        </button>
      </S>
      <S title="Pagination, LoadMore, NotificationItem">
        <Pagination page={page} total={35} onPage={setPage} />
        <LoadMore onClick={() => {}} />
        <NotificationItem
          type="request"
          text="Your Leave, 12 to 14 November was approved."
          createdAt={new Date().toISOString()}
          read={false}
          to="/requests"
        />
        <NotificationItem
          type="circular"
          text="New circular on GPF."
          createdAt={new Date().toISOString()}
          read
          to="/library/circulars"
        />
      </S>
    </div>
  );
}
