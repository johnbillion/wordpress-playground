import { createRoot } from 'react-dom/client';
import PlaygroundViewport from './components/playground-viewport';
import ExportButton from './components/export-button';
import ImportButton from './components/import-button';
import VersionSelector from './components/version-select';
import './styles.css';
import css from './style.module.css';

import { makeBlueprint } from './lib/make-blueprint';
import {
	LatestSupportedPHPVersion,
	SupportedPHPVersionsList,
} from '@php-wasm/universal';
import type { Blueprint } from '@wp-playground/blueprints';
import Select from './components/select';
import { PlaygroundClient } from '@wp-playground/remote';

const query = new URL(document.location.href).searchParams;

/*
 * Support passing blueprints in the URI frament, e.g.:
 * /#{"landingPage": "/?p=4"}
 */
const fragment = decodeURI(document.location.hash || '#').substring(1);
let blueprint: Blueprint;
try {
	blueprint = JSON.parse(fragment);
	// Allow overriding the preferred versions using query params
	// generated by the version switchers.
	if (query.get('php') || query.get('wp')) {
		if (!blueprint.preferredVersions) {
			blueprint.preferredVersions = {} as any;
		}
		blueprint.preferredVersions!.php =
			(query.get('php') as any) ||
			blueprint.preferredVersions!.php ||
			'8.0';
		blueprint.preferredVersions!.wp =
			query.get('wp') || blueprint.preferredVersions!.wp || 'latest';
	}
} catch (e) {
	blueprint = makeBlueprint({
		php: query.get('php') || '8.0',
		wp: query.get('wp') || 'latest',
		theme: query.get('theme') || undefined,
		plugins: query.getAll('plugin'),
		landingPage: query.get('url') || undefined,
		gutenbergPR: query.has('gutenberg-pr')
			? Number(query.get('gutenberg-pr'))
			: undefined,
	});
}

const isSeamless = (query.get('mode') || 'browser') === 'seamless';
const SupportedWordPressVersionsList = ['6.2', '6.1', '6.0', '5.9'];
const LatestSupportedWordPressVersion = SupportedWordPressVersionsList[0];

// @ts-ignore
const opfsSupported = typeof navigator?.storage?.getDirectory !== 'undefined';
const persistent = query.has('persistent') && opfsSupported;
const root = createRoot(document.getElementById('root')!);
root.render(
	<PlaygroundViewport
		persistent={persistent}
		isSeamless={isSeamless}
		blueprint={blueprint}
		toolbarButtons={[
			<VersionSelector
				name="php"
				versions={SupportedPHPVersionsList}
				selected={blueprint.preferredVersions?.php}
				default={LatestSupportedPHPVersion}
			/>,
			<VersionSelector
				name="wp"
				versions={SupportedWordPressVersionsList}
				selected={blueprint.preferredVersions?.wp}
				default={LatestSupportedWordPressVersion}
			/>,
			opfsSupported && <PersistenceSelect />,
			persistent && <OpfsResetButton />,
			<ImportButton key="export" />,
			<ExportButton key="export" />,
		]}
	/>
);

function PersistenceSelect() {
	return (
		<Select
			selected={persistent ? 'persistent' : 'temporary'}
			id={'persistence-mode'}
			onChange={(event) => {
				const url = new URL(window.location.toString());
				if (event.currentTarget.value === 'persistent') {
					url.searchParams.set('persistent', '1');
				} else {
					url.searchParams.delete('persistent');
				}
				window.location.assign(url);
			}}
			options={{
				['Temporary site']: 'temporary',
				['Persistent site']: 'persistent',
			}}
		/>
	);
}

function OpfsResetButton({ playground }: { playground?: PlaygroundClient }) {
	return (
		<button
			className={css.button}
			onClick={async () => {
				if (
					!window.confirm('Are you sure you want to reset the site?')
				) {
					return;
				}
				await playground?.resetOpfs();
				window.location.reload();
			}}
		>
			Reset site data
		</button>
	);
}
