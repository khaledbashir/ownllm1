import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BlockModel } from "@blocksuite/store";
import { createEmbedBlockSchema, defineEmbedModel } from "@blocksuite/blocks";
import { BlockElement } from "@blocksuite/block-std";
import { html } from "lit";
import { literal } from "lit/static-html.js";
import Workspace from "@/models/workspace";
import { NotePencil, Spinner } from "@phosphor-icons/react";

const defineOnce = (tag, ctor) => {
    if (!customElements.get(tag)) customElements.define(tag, ctor);
};

/**
 * FormBlockModel - BlockSuite model for embedded forms
 */
export class FormBlockModel extends defineEmbedModel(BlockModel) { }

/**
 * FormBlockSchema - Defines the schema for the form block
 */
export const FormBlockSchema = createEmbedBlockSchema({
    name: "form-embed",
    version: 1,
    toModel: () => new FormBlockModel(),
    props: () => ({
        formUuid: null,
        title: "Embedded Form",
        isSubmittable: true,
    }),
});

/**
 * FormBlockWidget - React component to render the form inside the block
 */
const FormBlockWidget = ({ model }) => {
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const formUuid = model.formUuid;

    useEffect(() => {
        async function fetchForm() {
            if (!formUuid) {
                setLoading(false);
                return;
            }
            try {
                const matches = window.location.pathname.match(/\/workspace\/([^\/]+)/);
                const slug = matches ? matches[1] : null;
                if (!slug) return;

                const _form = await Workspace.getForm(slug, formUuid);
                if (_form) setForm(_form);
            } catch (e) {
                console.error("[FormBlock] Failed to load form:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchForm();
    }, [formUuid]);

    if (!formUuid) {
        return (
            <div className="p-8 border-2 border-dashed border-white/10 rounded-xl text-center text-slate-400">
                <NotePencil size={32} className="mx-auto mb-2 opacity-50" />
                <p>No form selected. Use the slash menu to choose or generate a form.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center gap-2 text-slate-400">
                <Spinner className="animate-spin" />
                <span>Loading form...</span>
            </div>
        );
    }

    if (!form) return <div className="p-4 text-red-400">Error: Form not found.</div>;

    return (
        <div className="bg-theme-bg-secondary border border-white/10 rounded-xl overflow-hidden shadow-lg p-6">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-white">{form.title}</h3>
                {form.description && <p className="text-sm text-slate-400">{form.description}</p>}
            </div>

            {submitted ? (
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-green-400 text-center">
                    ✅ Thank you! Your response has been submitted.
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded inline-block">
                        Prototyping: Interactive preview enabled
                    </p>
                    <button
                        onClick={() => setSubmitted(true)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all"
                    >
                        Submit Form
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * FormBlockSpec - BlockSuite registration for the form block
 */
export class FormBlockElement extends BlockElement {
    render() {
        return html`<div class="form-block-container"></div>`;
    }

    connectedCallback() {
        super.connectedCallback();
        const container = this.querySelector(".form-block-container");
        if (container) {
            this._root = createRoot(container);
            this._root.render(<FormBlockWidget model={this.model} />);
        }
    }

    disconnectedCallback() {
        if (this._root) {
            this._root.unmount();
        }
        super.disconnectedCallback();
    }
}

defineOnce("affine-embed-form", FormBlockElement);

export const FormBlockSpec = {
    view: {
        component: literal`affine-embed-form`,
    },
};
