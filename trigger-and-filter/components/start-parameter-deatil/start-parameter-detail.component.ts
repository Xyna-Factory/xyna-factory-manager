/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2025 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { Component, inject, Input } from '@angular/core';
import { XoStartParameterDetails } from '@fman/trigger-and-filter/xo/xo-start-parameter-details.model';
import { coerceBoolean, Comparable } from '@zeta/base';
import { I18nService } from '@zeta/i18n';
import { XcLocalTableDataSource } from '@zeta/xc';

interface ParameterTableRow extends Comparable {
    name: string;
    documentation: string;
    necessity: string;
    type: string;
}

@Component({
    selector: 'start-parameter-detail',
    templateUrl: './start-parameter-detail.component.html',
    styleUrls: ['./start-parameter-detail.component.scss']
})
export class StartParameterDetailComponent {

    private readonly i18n = inject<I18nService>(I18nService);

    private _startParameter: XoStartParameterDetails[];
    tableDataSource: XcLocalTableDataSource<ParameterTableRow> = new XcLocalTableDataSource<ParameterTableRow>(this.i18n);
    legacy: boolean;

    @Input('start-parameter')
    set startParameter(parameter: XoStartParameterDetails[]) {
        if (!parameter) {
            return;
        }
        this._startParameter = parameter;
        if (parameter.length > 0 && parameter[0].lagacyParameterCombination?.length > 0) {
            this.legacy = true;
        } else {
            this.tableDataSource.localTableData.rows = parameter.map(param => this.buildTableRowFromStartParameter(param));
            this.tableDataSource.refresh();
            this.legacy = false;
        }
    }

    get startParameter(): XoStartParameterDetails[] {
        return this._startParameter;
    }

    @Input('compact')
    set compact(compact: boolean) {
        if (coerceBoolean(compact)) {
            this.tableDataSource.localTableData.columns = [
                { path: 'name', name: 'Name', disableFilter: true, disableSort: true, shrink: true },
                { path: 'documentation', name: 'Documentation', disableFilter: true, disableSort: true, shrink: true }
            ];
        } else {
            this.tableDataSource.localTableData.columns = [
                { path: 'name', name: 'Name', disableFilter: true, disableSort: true, shrink: true },
                { path: 'documentation', name: 'Documentation', disableFilter: true, disableSort: true, shrink: true },
                { path: 'necessity', name: 'Necessity', disableFilter: true, disableSort: true, shrink: true },
                { path: 'type', name: 'Type', disableFilter: true, disableSort: true }
            ];
        }
    }

    constructor() {
        this.tableDataSource.localTableData = { rows: [], columns: [] };
        this.compact = false;
    }

    private buildTableRowFromStartParameter(startparameter: XoStartParameterDetails): ParameterTableRow {
        return <ParameterTableRow> {
            name: startparameter.name,
            documentation: startparameter.documentation,
            necessity: startparameter.optional && !startparameter.mandatory ? 'optional' : startparameter.mandatory,
            type: startparameter.type
        };
    }
}
