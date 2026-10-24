import { useRef, useState } from 'react';
import { useHref } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';

export function SessionInvite({ id, name }: { id: string; name: string }) {
  const href = useHref(`/session/${id}`);
  const url = new URL(href, window.location.href).href;
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  return (
    <section className="invitation-card" aria-label="Приглашение в игру">
      <div className="invitation-qr">
        <QRCodeSVG
          value={url}
          size={208}
          marginSize={4}
          level="M"
          title="QR-код приглашения в игру"
        />
        <button className="text-link text-sm" onClick={() => dialog.current?.showModal()}>
          Увеличить QR-код
        </button>
      </div>
      <div className="min-w-0 space-y-3">
        <span className="eyebrow">Место за столом найдётся</span>
        <h3 className="text-2xl font-semibold">Соберите свою компанию</h3>
        <p className="text-sm">
          Наведите камеру телефона на QR-код, введите имя и присоединитесь. Для аудитории увеличьте
          код на проекторе.
        </p>
        <label htmlFor="invitation" className="block text-sm font-semibold">
          Пригласите друзей
        </label>
        <input
          id="invitation"
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="w-full min-w-0 rounded-inset border border-brass-500/40 bg-white px-3 text-sm"
        />
        <button
          className="button button-secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setCopyError(false);
            } catch {
              setCopyError(true);
            }
          }}
        >
          {copied ? 'Скопировано' : 'Копировать ссылку'}
        </button>
        {copyError && (
          <p role="status" className="text-sm">
            Не удалось скопировать автоматически. Выделите ссылку выше и скопируйте её.
          </p>
        )}
      </div>
      <dialog ref={dialog} className="qr-dialog" aria-labelledby="qr-title">
        <div className="flex items-start justify-between gap-4 text-left">
          <div className="min-w-0">
            <p className="eyebrow">Присоединяйтесь к игре</p>
            <h2 id="qr-title" className="mt-1 text-2xl font-semibold">
              {name}
            </h2>
          </div>
          <button
            className="button button-secondary shrink-0"
            onClick={() => dialog.current?.close()}
          >
            Закрыть
          </button>
        </div>
        <QRCodeSVG
          value={url}
          size={640}
          marginSize={4}
          level="M"
          title="Большой QR-код приглашения в игру"
        />
        <p className="font-semibold">Камера → QR-код → ваше имя → «Присоединиться»</p>
        <p className="mt-2 break-all text-xs">{url}</p>
      </dialog>
    </section>
  );
}
