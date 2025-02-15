import type { BeanCollection } from '../../context/context';
import type { PaginationChangedEvent } from '../../events';
import type { WithoutGridCommon } from '../../interfaces/iCommon';
import { _clearElement } from '../../utils/dom';
import { _warnOnce } from '../../utils/function';
import { _missingOrEmpty } from '../../utils/generic';
import { AgSelect } from '../../widgets/agSelect';
import type { ComponentSelector } from '../../widgets/component';
import { Component } from '../../widgets/component';
import type { PaginationService } from '../paginationService';

export class PageSizeSelectorComp extends Component {
    private paginationService: PaginationService;

    public wireBeans(beans: BeanCollection): void {
        this.paginationService = beans.paginationService!;
    }

    private selectPageSizeComp: AgSelect | undefined;
    private hasEmptyOption = false;

    constructor() {
        super(/* html */ `<span class="ag-paging-page-size"></span>`);
    }

    public postConstruct() {
        this.addManagedPropertyListener('paginationPageSizeSelector', () => {
            this.onPageSizeSelectorValuesChange();
        });

        this.addManagedEventListeners({ paginationChanged: (event) => this.handlePaginationChanged(event) });
    }

    private handlePageSizeItemSelected = (): void => {
        if (!this.selectPageSizeComp) {
            return;
        }

        const newValue = this.selectPageSizeComp.getValue();

        if (!newValue) {
            return;
        }

        const paginationPageSize = Number(newValue);

        if (
            isNaN(paginationPageSize) ||
            paginationPageSize < 1 ||
            paginationPageSize === this.paginationService.getPageSize()
        ) {
            return;
        }

        this.paginationService.setPageSize(paginationPageSize, 'pageSizeSelector');

        if (this.hasEmptyOption) {
            // Toggle the selector to force a refresh of the options and hide the empty option,
            // as it's no longer needed.
            this.toggleSelectDisplay(true);
        }

        this.selectPageSizeComp.getFocusableElement().focus();
    };

    private handlePaginationChanged(paginationChangedEvent?: WithoutGridCommon<PaginationChangedEvent>): void {
        if (!this.selectPageSizeComp || !paginationChangedEvent?.newPageSize) {
            return;
        }

        const paginationPageSize = this.paginationService.getPageSize();
        if (this.getPageSizeSelectorValues().includes(paginationPageSize)) {
            this.selectPageSizeComp.setValue(paginationPageSize.toString());
        } else {
            if (this.hasEmptyOption) {
                this.selectPageSizeComp.setValue('');
            } else {
                this.toggleSelectDisplay(true);
            }
        }
    }

    public toggleSelectDisplay(show: boolean) {
        if (this.selectPageSizeComp) {
            this.reset();
        }

        if (!show) {
            return;
        }

        this.reloadPageSizesSelector();

        if (!this.selectPageSizeComp) {
            return;
        }

        this.appendChild(this.selectPageSizeComp);
    }

    private reset(): void {
        _clearElement(this.getGui());

        if (!this.selectPageSizeComp) {
            return;
        }

        this.selectPageSizeComp = this.destroyBean(this.selectPageSizeComp);
    }

    private onPageSizeSelectorValuesChange(): void {
        if (!this.selectPageSizeComp) {
            return;
        }

        if (this.shouldShowPageSizeSelector()) {
            this.reloadPageSizesSelector();
        }
    }

    public shouldShowPageSizeSelector(): boolean {
        return (
            this.gos.get('pagination') &&
            !this.gos.get('suppressPaginationPanel') &&
            !this.gos.get('paginationAutoPageSize') &&
            this.gos.get('paginationPageSizeSelector') !== false
        );
    }

    private reloadPageSizesSelector(): void {
        const pageSizeOptions: (number | string)[] = this.getPageSizeSelectorValues();
        const paginationPageSizeOption: number = this.paginationService.getPageSize();
        const shouldAddAndSelectEmptyOption =
            !paginationPageSizeOption || !pageSizeOptions.includes(paginationPageSizeOption);
        if (shouldAddAndSelectEmptyOption) {
            const pageSizeSet = this.gos.exists('paginationPageSize');
            const pageSizesSet = this.gos.get('paginationPageSizeSelector') !== true;

            _warnOnce(
                `'paginationPageSize=${paginationPageSizeOption}'${pageSizeSet ? '' : ' (default value)'}, but ${paginationPageSizeOption} is not included in${pageSizesSet ? '' : ' the default'} paginationPageSizeSelector=[${pageSizeOptions.join(', ')}].`
            );
            if (!pageSizesSet) {
                _warnOnce(
                    `Either set 'paginationPageSizeSelector' to an array that includes ${paginationPageSizeOption} or to 'false' to disable the page size selector.`
                );
            }
            // When the paginationPageSize option is set to a value that is
            // not in the list of page size options.
            pageSizeOptions.unshift('');
        }

        if (this.selectPageSizeComp) {
            this.selectPageSizeComp = this.destroyBean(this.selectPageSizeComp);
        }

        const localeTextFunc = this.localeService.getLocaleTextFunc();
        const localisedLabel = localeTextFunc('pageSizeSelectorLabel', 'Page Size:');

        const options = pageSizeOptions.map((value) => ({
            value: String(value),
            text: String(value),
        }));

        const localisedAriaLabel = localeTextFunc('ariaPageSizeSelectorLabel', 'Page Size');

        this.selectPageSizeComp = this.createManagedBean(new AgSelect())
            .addOptions(options)
            .setValue(String(shouldAddAndSelectEmptyOption ? '' : paginationPageSizeOption))
            .setAriaLabel(localisedAriaLabel)
            .setLabel(localisedLabel)
            .onValueChange(() => this.handlePageSizeItemSelected());

        this.hasEmptyOption = shouldAddAndSelectEmptyOption;
    }

    private getPageSizeSelectorValues(): number[] {
        const defaultValues = [20, 50, 100];
        const paginationPageSizeSelectorValues = this.gos.get('paginationPageSizeSelector');

        if (!Array.isArray(paginationPageSizeSelectorValues) || _missingOrEmpty(paginationPageSizeSelectorValues)) {
            return defaultValues;
        }

        return [...paginationPageSizeSelectorValues].sort((a, b) => a - b);
    }

    public override destroy() {
        this.toggleSelectDisplay(false);
        super.destroy();
    }
}

export const PageSizeSelectorSelector: ComponentSelector = {
    selector: 'AG-PAGE-SIZE-SELECTOR',
    component: PageSizeSelectorComp,
};
