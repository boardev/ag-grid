import type { Framework } from '@ag-grid-types';
import type { FunctionComponent } from 'react';

import type { ApiDocumentationModel } from '../types';
import { Section } from './Section';

interface Props {
    framework: Framework;
    model: ApiDocumentationModel;
}

export const ApiDocumentation: FunctionComponent<Props> = ({ framework, model }) => {
    if (model.type === 'multiple') {
        return model.entries.map(([name, { properties, meta }]) => (
            <Section
                key={name}
                framework={framework}
                title={name}
                properties={properties}
                config={model.config}
                meta={meta}
            />
        ));
    }

    return (
        <Section
            framework={framework}
            title={model.title}
            properties={model.properties}
            config={{ ...model.config, isSubset: true }}
            names={model.names}
        />
    );
};
