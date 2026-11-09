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
import { ApiService, RuntimeContext, Xo, XoArray, XoArrayClassInterface } from '@zeta/api';
import { Comparable } from '@zeta/base';
import { XcSelectionDataSource, XcSelectionModel, XcSortDirection, XcSortPredicate } from '@zeta/xc';

import { map } from 'rxjs/operators';

import { XoRuntimeApplication } from '../xo/xo-runtime-application.model';


export class Application extends Comparable {
    constructor(public name: string, public runtimeApplications: XoRuntimeApplication[]) {
        super();
    }

    get uniqueKey(): string {
        return this.name;
    }
}


export class ApplicationDataSource<T extends XoRuntimeApplication = XoRuntimeApplication, O extends XoArray<T> = XoArray<T>> extends XcSelectionDataSource<Application> {

    constructor(private readonly apiService: ApiService, public rtc: RuntimeContext, public orderType: string, public input?: Xo | Xo[], public output?: XoArrayClassInterface<O>) {
        super(new XcSelectionModel());
    }


    refresh() {
        super.refresh();
        this.apiService.startOrderAssertFlat<T>(
            this.rtc,
            this.orderType,
            // @ts-expect-error(TODO:)
            this.input,
            this.output
        ).pipe(
            map(output => {
                const names = new Set<string>(output.map(runtimeApplication => runtimeApplication.name));
                const applications = new Array<Application>();
                names.forEach(name => applications.push(new Application(name, output.filter(runtimeApplication => runtimeApplication.name === name))));
                applications.sort(XcSortPredicate(XcSortDirection.asc, t => t.name.toLowerCase()));
                return applications;
            })
        ).subscribe(output =>
            this.data = output
        );
    }


    get rawData(): Application[] {
        return this.data;
    }
}
