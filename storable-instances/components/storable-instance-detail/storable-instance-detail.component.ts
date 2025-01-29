/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
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
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';

import { ApiService, FullQualifiedName, RuntimeContext, StartOrderOptionsBuilder, XoArray, XoObject, XoRuntimeContext } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcStructureTreeDataSource } from '@zeta/xc';

import { Subject, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { XoStoreParameter } from '../../xo/xo-storeparameter.model';


@Component({
    selector: 'storable-instance-detail',
    templateUrl: './storable-instance-detail.component.html',
    styleUrls: ['./storable-instance-detail.component.scss'],
    standalone: false
})
export class StorableInstanceDetailComponent implements OnDestroy {
    @Output()
    readonly valueChange = new EventEmitter<void>();

    @Input()
    set xoRtc(xoRtc: XoRuntimeContext) {
        if (xoRtc) {
            this._rtc = xoRtc.toRuntimeContext();
            this.updateTree();
        }
    }

    @Input()
    set fqn(fqn: FullQualifiedName) {
        if (fqn) {
            this._fqn = fqn;
            this.updateTree();
        }
    }

    @Input()
    set selectedStorable(storable: XoObject) {
        if (storable) {
            this._selectedStorable = storable.clone();
            this.updateTree();
        }
    }

    @Input()
    set editSubject(subject: Subject<void>) {
        this.editSubscription = subject.subscribe(() => {
            const updatedObject = this.structureTreeDataSource.container.data[0];

            // Checks for complexTemplates and clears them
            for (const key of Object.keys(updatedObject.data)) {
                if (typeof updatedObject.data[key] === 'object') {
                    if (key.startsWith('complexTemplate_')) {
                        updatedObject.data[key] = null;
                    }
                }
            }

            let isSucceeded = false;
            this.apiService
                .startOrder(this._rtc, 'xnwh.persistence.Store', [updatedObject, new XoStoreParameter()], null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
                .pipe(
                    finalize(() => {
                        if (!isSucceeded) {
                            this.dialogService.error(this.i18n.translate(this.ERROR_MESSAGE));
                        }
                    })
                )
                .subscribe(
                    result => {
                        if (!result.errorMessage) {
                            isSucceeded = true;
                            this.valueChange.emit();
                        } else {
                            this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
                        }
                    },
                    error => this.dialogService.error(error)
                );
        });
    }

    private editSubscription: Subscription;
    private _rtc: RuntimeContext;
    private _fqn: FullQualifiedName;
    private _selectedStorable: XoObject;

    structureTreeDataSource: XcStructureTreeDataSource;

    ERROR_MESSAGE = 'fman.storable-instances.storable-instances-details.error-message';


    constructor(
        private readonly i18n: I18nService,
        private readonly apiService: ApiService,
        private readonly dialogService: XcDialogService
    ) {
    }


    ngOnDestroy() {
        this.editSubscription.unsubscribe();
    }


    private updateTree() {
        if (this._rtc && this._fqn && this._selectedStorable) {
            this.structureTreeDataSource = new XcStructureTreeDataSource(this.apiService, this.i18n, this._rtc, [{ rtc: this._rtc, fqn: this._fqn }]);
            this.structureTreeDataSource.container = new XoArray();
            this.structureTreeDataSource.container.append(this._selectedStorable);
            this.structureTreeDataSource.refresh();
        }
    }
}
