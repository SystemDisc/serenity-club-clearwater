'use client'
/* eslint-disable @next/next/no-img-element -- A bounded CMS preview in the editor. */
import { $isBlockNode, useBlockComponentContext } from '@payloadcms/richtext-lexical/client'
import { useForm, useFormFields } from '@payloadcms/ui'
import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { $getNodeByKey } from '@payloadcms/richtext-lexical/lexical'
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import type { Media } from '@/payload-types'
import { useResource } from './useResource'

/** Payload's drawer explicitly saves the nested form before returning to article editing. */
export default function NewsPhotoBlock() {
  const { BlockCollapsible, EditButton, RemoveButton, nodeKey } = useBlockComponentContext()
  const media = useFormFields(([fields]) => fields.media?.value) as number | Media | null
  const alt = useFormFields(([fields]) => fields.alt?.value) as string | undefined
  const caption = useFormFields(([fields]) => fields.caption?.value) as string | undefined
  const id = typeof media === 'object' ? media?.id : media
  const [editor] = useLexicalComposerContext()
  const subscribe = useCallback(
    (change: () => void) => editor.registerUpdateListener(change),
    [editor],
  )
  const getSnapshot = useCallback(
    () =>
      editor.getEditorState().read(() => {
        const node = $getNodeByKey(nodeKey)
        if (!$isBlockNode(node)) return ''
        const fields = node.getFields()
        const imageID =
          typeof fields.media === 'object' && fields.media ? fields.media.id : fields.media
        return JSON.stringify([imageID || null, fields.caption || '', fields.alt || ''])
      }),
    [editor, nodeKey],
  )
  const saved = useSyncExternalStore(subscribe, getSnapshot, () => '')
  const pending = saved !== JSON.stringify([id || null, caption || '', alt || ''])
  const { setBackgroundProcessing } = useForm()
  // Payload debounces nested block validation. Its Save control must wait for the
  // current fields to reach the Lexical document, rather than racing that request.
  useEffect(() => {
    setBackgroundProcessing(pending)
    return () => setBackgroundProcessing(false)
  }, [pending, setBackgroundProcessing])
  const photo = useResource<Media>(id ? `/api/media/${id}?depth=0` : null)
  return (
    <BlockCollapsible
      Label={<span>Article photo</span>}
      disableBlockName
      editButton={false}
      removeButton={false}
    >
      {photo.value?.url ? (
        <figure className="club-image-preview">
          <img
            src={photo.value.sizes?.medium?.url || photo.value.url}
            alt={photo.value.alt || 'Article photo preview'}
          />
          {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
      ) : (
        <p>Choose a photo and an optional caption.</p>
      )}
      <p role="status">{pending ? 'Saving photo details…' : 'Photo details are ready.'}</p>
      <p>Open the photo editor, then choose Save changes to return to your article.</p>
      <div className="club-photo-actions">
        <label>
          Edit photo and caption <EditButton />
        </label>
        <label>
          Remove article photo <RemoveButton />
        </label>
      </div>
      {photo.error ? <p role="alert">{photo.error}</p> : null}
    </BlockCollapsible>
  )
}
